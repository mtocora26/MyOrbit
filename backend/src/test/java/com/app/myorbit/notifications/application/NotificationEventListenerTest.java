package com.app.myorbit.notifications.application;

import com.app.myorbit.habits.domain.HabitPendingEvent;
import com.app.myorbit.notifications.domain.NotificationRequest;
import com.app.myorbit.notifications.domain.NotificationType;
import com.app.myorbit.tasks.domain.TaskCompletedEvent;
import com.app.myorbit.tasks.domain.TaskCreatedEvent;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class NotificationEventListenerTest {
    private final NotificationService service = mock(NotificationService.class);
    private final NotificationEventListener listener = new NotificationEventListener(service);

    @Test
    void taskCreatedWithDueBecomesADeadlineNotification() {
        LocalDateTime due = LocalDateTime.of(2026, 11, 10, 9, 0);

        listener.onTaskCreated(new TaskCreatedEvent("u1", "t1", "Informe", due));

        verify(service).notify(new NotificationRequest(NotificationType.DEADLINE, "u1", "t1", "Informe", due));
    }

    @Test
    void taskCreatedWithoutDueDoesNotNotify() {
        listener.onTaskCreated(new TaskCreatedEvent("u1", "t1", "Informe", null));

        verify(service, never()).notify(any());
    }

    @Test
    void taskCompletedBecomesAnEventNotification() {
        listener.onTaskCompleted(new TaskCompletedEvent("u1", "t1", "Informe"));

        verify(service).notify(new NotificationRequest(NotificationType.EVENT, "u1", "t1", "Informe", null));
    }

    @Test
    void habitPendingBecomesAHabitNotification() {
        listener.onHabitPending(new HabitPendingEvent("u1", "h1", "Leer", LocalDate.of(2026, 11, 7)));

        verify(service).notify(new NotificationRequest(NotificationType.HABIT, "u1", "h1", "Leer", LocalDate.of(2026, 11, 7).atStartOfDay()));
    }

    @Test
    void aFailureWhileNotifyingDoesNotPropagate() {
        doThrow(new IllegalStateException("mongo caído")).when(service).notify(any());

        listener.onTaskCompleted(new TaskCompletedEvent("u1", "t1", "Informe"));
    }
}
