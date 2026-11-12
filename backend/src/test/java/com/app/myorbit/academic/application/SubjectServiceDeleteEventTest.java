package com.app.myorbit.academic.application;

import com.app.myorbit.academic.domain.Subject;
import com.app.myorbit.academic.domain.SubjectDeletedEvent;
import com.app.myorbit.academic.infrastructure.EvaluationRepository;
import com.app.myorbit.academic.infrastructure.SubjectRepository;
import com.app.myorbit.shared.error.NotFoundException;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SubjectServiceDeleteEventTest {
    private final SubjectRepository repository = mock(SubjectRepository.class);
    private final EvaluationRepository evaluations = mock(EvaluationRepository.class);
    private final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    private final SubjectService service = new SubjectService(repository, evaluations, mock(SemesterService.class), events);

    private Subject subject(String userId) {
        Subject subject = new Subject();
        subject.setId("s1");
        subject.setUserId(userId);
        subject.update("Redes", 3, "2026-1", "#2E90FA");
        return subject;
    }

    @Test
    void deletingASubjectPublishesTheEventSoTasksAreUnlinked() {
        when(repository.findById("s1")).thenReturn(Optional.of(subject("u1")));

        service.delete("u1", "s1");

        InOrder order = inOrder(evaluations, repository, events);
        order.verify(evaluations).deleteBySubjectId("s1");
        order.verify(repository).deleteById("s1");
        ArgumentCaptor<SubjectDeletedEvent> event = ArgumentCaptor.forClass(SubjectDeletedEvent.class);
        order.verify(events).publishEvent(event.capture());
        assertEquals("u1", event.getValue().userId());
        assertEquals("s1", event.getValue().subjectId());
    }

    @Test
    void aSubjectOfAnotherUserIsNeitherDeletedNorAnnounced() {
        when(repository.findById("s1")).thenReturn(Optional.of(subject("u2")));

        assertThrows(NotFoundException.class, () -> service.delete("u1", "s1"));
        verify(repository, never()).deleteById(any());
        verify(events, never()).publishEvent(any(Object.class));
    }
}
