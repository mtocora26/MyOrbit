package com.app.myorbit.academic.application;

import com.app.myorbit.academic.api.SubjectRequest;
import com.app.myorbit.academic.domain.Subject;
import com.app.myorbit.academic.infrastructure.SubjectRepository;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.NotFoundException;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SubjectServiceTest {
    private final SubjectRepository repository = mock(SubjectRepository.class);
    private final SubjectService service = new SubjectService(repository);

    private Subject subjectOf(String id, String userId, String name, String semester) {
        Subject subject = new Subject();
        subject.setId(id);
        subject.setUserId(userId);
        subject.update(name, 3, semester, "#2E90FA");
        return subject;
    }

    @Test
    void createAssignsOwnerAndDefaultColor() {
        when(repository.findByUserIdAndSemester("u1", "2026-1")).thenReturn(List.of());
        when(repository.save(any(Subject.class))).then(returnsFirstArg());

        Subject created = service.create("u1", new SubjectRequest(" Redes ", 3, "2026-1", null));

        assertEquals("u1", created.getUserId());
        assertEquals("Redes", created.getName());
        assertEquals(SubjectService.DEFAULT_COLOR, created.getColor());
    }

    @Test
    void createRejectsDuplicatedNameInTheSameSemester() {
        when(repository.findByUserIdAndSemester("u1", "2026-1")).thenReturn(List.of(subjectOf("s1", "u1", "Redes", "2026-1")));

        assertThrows(BusinessRuleException.class, () -> service.create("u1", new SubjectRequest("redes", 3, "2026-1", null)));
        verify(repository, never()).save(any());
    }

    @Test
    void createAllowsTheSameNameInAnotherSemester() {
        when(repository.findByUserIdAndSemester("u1", "2026-2")).thenReturn(List.of());
        when(repository.save(any(Subject.class))).then(returnsFirstArg());

        Subject created = service.create("u1", new SubjectRequest("Redes", 3, "2026-2", "#12B76A"));

        assertEquals("2026-2", created.getSemester());
    }

    @Test
    void updateKeepingItsOwnNameIsNotADuplicate() {
        Subject subject = subjectOf("s1", "u1", "Redes", "2026-1");
        when(repository.findById("s1")).thenReturn(Optional.of(subject));
        when(repository.findByUserIdAndSemester("u1", "2026-1")).thenReturn(List.of(subject));
        when(repository.save(any(Subject.class))).then(returnsFirstArg());

        Subject updated = service.update("u1", "s1", new SubjectRequest("Redes", 4, "2026-1", "#12B76A"));

        assertEquals(4, updated.getCredits());
    }

    @Test
    void subjectsOfOtherUsersAreNotFound() {
        when(repository.findById("s1")).thenReturn(Optional.of(subjectOf("s1", "u2", "Redes", "2026-1")));

        assertThrows(NotFoundException.class, () -> service.update("u1", "s1", new SubjectRequest("Redes", 3, "2026-1", null)));
        assertThrows(NotFoundException.class, () -> service.delete("u1", "s1"));
        verify(repository, never()).deleteById(anyString());
    }
}
