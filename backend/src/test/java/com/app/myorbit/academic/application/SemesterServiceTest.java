package com.app.myorbit.academic.application;

import com.app.myorbit.academic.api.SemesterRequest;
import com.app.myorbit.academic.domain.Semester;
import com.app.myorbit.academic.domain.Subject;
import com.app.myorbit.academic.infrastructure.SemesterRepository;
import com.app.myorbit.academic.infrastructure.SubjectRepository;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.NotFoundException;
import com.app.myorbit.users.application.UserZoneService;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SemesterServiceTest {
    private final SemesterRepository repository = mock(SemesterRepository.class);
    private final SubjectRepository subjects = mock(SubjectRepository.class);
    private final UserZoneService zones = mock(UserZoneService.class);
    private final SemesterService service = new SemesterService(repository, subjects, zones);

    private Semester semesterOf(String id, String userId, String name) {
        Semester semester = new Semester();
        semester.setId(id);
        semester.setUserId(userId);
        semester.update(name, null, null);
        return semester;
    }

    private Subject subjectIn(String semester) {
        Subject subject = new Subject();
        subject.setId("s1");
        subject.setUserId("u1");
        subject.update("Redes", 3, semester, "#2E90FA");
        return subject;
    }

    @Test
    void createAssignsOwnerAndDates() {
        when(repository.findByUserIdAndName("u1", "2026-1")).thenReturn(Optional.empty());
        when(repository.save(any(Semester.class))).then(returnsFirstArg());

        Semester created = service.create("u1", new SemesterRequest("2026-1", LocalDate.of(2026, 2, 1), LocalDate.of(2026, 6, 15)));

        assertEquals("u1", created.getUserId());
        assertEquals(LocalDate.of(2026, 6, 15), created.getEndDate());
    }

    @Test
    void createRejectsDuplicatedName() {
        when(repository.findByUserIdAndName("u1", "2026-1")).thenReturn(Optional.of(semesterOf("x", "u1", "2026-1")));

        assertThrows(BusinessRuleException.class, () -> service.create("u1", new SemesterRequest("2026-1", null, null)));
        verify(repository, never()).save(any());
    }

    @Test
    void createRejectsEndBeforeStart() {
        when(repository.findByUserIdAndName("u1", "2026-1")).thenReturn(Optional.empty());

        assertThrows(BusinessRuleException.class, () -> service.create("u1",
                new SemesterRequest("2026-1", LocalDate.of(2026, 6, 15), LocalDate.of(2026, 2, 1))));
    }

    @Test
    void getOwnedHidesOtherUsersSemesters() {
        when(repository.findById("x")).thenReturn(Optional.of(semesterOf("x", "u2", "2026-1")));

        assertThrows(NotFoundException.class, () -> service.getOwned("u1", "x"));
    }

    @Test
    void renamingMovesItsSubjects() {
        Semester semester = semesterOf("x", "u1", "2026-1");
        Subject subject = subjectIn("2026-1");
        when(repository.findById("x")).thenReturn(Optional.of(semester));
        when(repository.findByUserIdAndName("u1", "2026-2")).thenReturn(Optional.empty());
        when(repository.save(any(Semester.class))).then(returnsFirstArg());
        when(subjects.findByUserIdAndSemester("u1", "2026-1")).thenReturn(List.of(subject));

        service.update("u1", "x", new SemesterRequest("2026-2", null, null));

        assertEquals("2026-2", subject.getSemester());
        verify(subjects).saveAll(List.of(subject));
    }

    @Test
    void updatingOnlyDatesKeepsSubjectsUntouched() {
        Semester semester = semesterOf("x", "u1", "2026-1");
        when(repository.findById("x")).thenReturn(Optional.of(semester));
        when(repository.findByUserIdAndName("u1", "2026-1")).thenReturn(Optional.of(semester));
        when(repository.save(any(Semester.class))).then(returnsFirstArg());

        service.update("u1", "x", new SemesterRequest("2026-1", LocalDate.of(2026, 2, 1), LocalDate.of(2026, 6, 15)));

        verify(subjects, never()).saveAll(any());
    }

    @Test
    void deleteIsRefusedWhileSubjectsUseIt() {
        when(repository.findById("x")).thenReturn(Optional.of(semesterOf("x", "u1", "2026-1")));
        when(subjects.findByUserIdAndSemester("u1", "2026-1")).thenReturn(List.of(subjectIn("2026-1")));

        assertThrows(BusinessRuleException.class, () -> service.delete("u1", "x"));
        verify(repository, never()).deleteById(any());
    }

    @Test
    void deleteRemovesAnEmptySemester() {
        when(repository.findById("x")).thenReturn(Optional.of(semesterOf("x", "u1", "2026-1")));
        when(subjects.findByUserIdAndSemester("u1", "2026-1")).thenReturn(List.of());

        service.delete("u1", "x");

        verify(repository).deleteById("x");
    }

    @Test
    void ensureExistsCreatesWithoutDatesOnlyWhenMissing() {
        when(repository.findByUserIdAndName("u1", "2026-1")).thenReturn(Optional.empty());
        when(repository.save(any(Semester.class))).then(returnsFirstArg());

        Semester created = service.ensureExists("u1", "2026-1");

        assertNull(created.getStartDate());
        Semester existing = semesterOf("x", "u1", "2026-2");
        when(repository.findByUserIdAndName("u1", "2026-2")).thenReturn(Optional.of(existing));
        assertEquals("x", service.ensureExists("u1", "2026-2").getId());
    }
}
