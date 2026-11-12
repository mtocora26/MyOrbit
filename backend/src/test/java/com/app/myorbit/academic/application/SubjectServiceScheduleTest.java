package com.app.myorbit.academic.application;

import com.app.myorbit.academic.api.ClassSlotRequest;
import com.app.myorbit.academic.api.SubjectRequest;
import com.app.myorbit.academic.domain.Subject;
import com.app.myorbit.academic.infrastructure.EvaluationRepository;
import com.app.myorbit.academic.infrastructure.SubjectRepository;
import com.app.myorbit.shared.error.BusinessRuleException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SubjectServiceScheduleTest {
    private final SubjectRepository repository = mock(SubjectRepository.class);
    private final SubjectService service = new SubjectService(repository, mock(EvaluationRepository.class), mock(SemesterService.class));

    @BeforeEach
    void stubRepository() {
        when(repository.findByUserIdAndSemester("u1", "2026-1")).thenReturn(List.of());
        when(repository.save(any(Subject.class))).then(returnsFirstArg());
    }

    private SubjectRequest request(ClassSlotRequest... slots) {
        return new SubjectRequest("Redes", 3, "2026-1", null, null, null, null, List.of(slots));
    }

    @Test
    void createStoresTheSlotsWithRoomAndNormalizedHours() {
        Subject created = service.create("u1", request(
                new ClassSlotRequest(1, "08:00", "10:00", " Aula 301 "), new ClassSlotRequest(3, "14:00", "16:00", null)));

        assertEquals(2, created.getSchedule().size());
        assertEquals("Aula 301", created.getSchedule().get(0).getRoom());
        assertEquals("14:00", created.getSchedule().get(1).getStart());
    }

    @Test
    void createWithoutScheduleLeavesItEmpty() {
        assertTrue(service.create("u1", new SubjectRequest("Redes", 3, "2026-1", null)).getSchedule().isEmpty());
    }

    @Test
    void createRejectsEndNotAfterStart() {
        assertThrows(BusinessRuleException.class, () -> service.create("u1", request(new ClassSlotRequest(1, "10:00", "09:00", null))));
        verify(repository, never()).save(any());
    }

    @Test
    void createRejectsOverlappingSlots() {
        BusinessRuleException error = assertThrows(BusinessRuleException.class, () -> service.create("u1", request(
                new ClassSlotRequest(1, "08:00", "10:00", null), new ClassSlotRequest(1, "09:00", "11:00", null))));

        assertTrue(error.getMessage().contains("solapan"));
        verify(repository, never()).save(any());
    }

    @Test
    void updateReplacesTheWholeSchedule() {
        Subject existing = service.create("u1", request(new ClassSlotRequest(1, "08:00", "10:00", null)));
        existing.setId("s1");
        when(repository.findById("s1")).thenReturn(java.util.Optional.of(existing));

        Subject updated = service.update("u1", "s1", request(new ClassSlotRequest(5, "16:00", "18:00", "Lab")));
        assertEquals(1, updated.getSchedule().size());
        assertEquals(5, updated.getSchedule().get(0).getDayOfWeek());

        assertTrue(service.update("u1", "s1", new SubjectRequest("Redes", 3, "2026-1", null)).getSchedule().isEmpty());
    }
}
