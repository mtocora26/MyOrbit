package com.app.myorbit.notifications.application;

import com.app.myorbit.academic.domain.ClassStartingEvent;
import com.app.myorbit.academic.domain.ExamSoonEvent;
import com.app.myorbit.academic.domain.SubjectAtRiskEvent;
import com.app.myorbit.events.domain.EventStartingEvent;
import com.app.myorbit.habits.domain.HabitPendingEvent;
import com.app.myorbit.notifications.domain.NotificationRequest;
import com.app.myorbit.notifications.domain.NotificationType;
import com.app.myorbit.tasks.domain.TaskCreatedEvent;
import com.app.myorbit.tasks.domain.TaskDueSoonEvent;
import com.app.myorbit.tasks.domain.TaskOverdueEvent;
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
    void habitPendingBecomesAHabitNotification() {
        listener.onHabitPending(new HabitPendingEvent("u1", "h1", "Leer", LocalDate.of(2026, 11, 7)));

        verify(service).notifyOncePerDay(new NotificationRequest(NotificationType.HABIT, "u1", "h1", "Leer", LocalDate.of(2026, 11, 7).atStartOfDay()));
    }

    @Test
    void aFailureWhileNotifyingDoesNotPropagate() {
        doThrow(new IllegalStateException("mongo caído")).when(service).notify(any());

        listener.onTaskCreated(new TaskCreatedEvent("u1", "t1", "Informe", LocalDateTime.of(2026, 11, 10, 9, 0)));
    }

    @Test
    void taskDueInADayBecomesADeadlineReminderOncePerDay() {
        LocalDateTime due = LocalDateTime.of(2026, 11, 8, 9, 0);

        listener.onTaskDueSoon(new TaskDueSoonEvent("u1", "t1", "Informe", due, false));

        verify(service).notifyOncePerDay(new NotificationRequest(NotificationType.DEADLINE, "u1", "t1", "Informe", due));
        verify(service, never()).notify(any());
    }

    @Test
    void taskDueInAnHourUsesItsOwnShortDedupWindow() {
        LocalDateTime due = LocalDateTime.of(2026, 11, 8, 9, 0);

        listener.onTaskDueSoon(new TaskDueSoonEvent("u1", "t1", "Informe", due, true));

        verify(service).notifyUnlessWithin(new NotificationRequest(NotificationType.DEADLINE, "u1", "t1", "Informe", due),
                NotificationEventListener.IMMINENT_DEDUP);
        verify(service, never()).notifyOncePerDay(any());
    }

    @Test
    void overdueSummaryIsOncePerDayWithTheCountAsSubject() {
        listener.onTaskOverdue(new TaskOverdueEvent("u1", 3));

        verify(service).notifyOncePerDay(new NotificationRequest(NotificationType.OVERDUE, "u1", "overdue", "3", null));
    }

    @Test
    void examSoonNotifiesOncePerEvaluationWithinItsWindow() {
        LocalDateTime due = LocalDateTime.of(2026, 11, 9, 8, 0);

        listener.onExamSoon(new ExamSoonEvent("u1", "e1", "Parcial 1", "Cálculo", due));

        verify(service).notifyUnlessWithin(new NotificationRequest(NotificationType.EXAM, "u1", "e1", "Parcial 1 (Cálculo)", due),
                NotificationEventListener.EXAM_DEDUP);
    }

    @Test
    void subjectAtRiskNotifiesAtMostOncePerWeek() {
        listener.onSubjectAtRisk(new SubjectAtRiskEvent("u1", "s1", "Cálculo"));

        verify(service).notifyUnlessWithin(new NotificationRequest(NotificationType.AT_RISK, "u1", "s1", "Cálculo", null),
                NotificationEventListener.AT_RISK_DEDUP);
    }

    @Test
    void classStartingNotifiesOncePerOccurrenceWithRoom() {
        LocalDateTime startsAt = LocalDateTime.of(2026, 11, 9, 8, 0);

        listener.onClassStarting(new ClassStartingEvent("u1", "s1", "Cálculo", "A-101", startsAt));

        verify(service).notifyUnlessWithin(new NotificationRequest(NotificationType.CLASS, "u1", "s1|" + startsAt,
                "clase de Cálculo en A-101", startsAt), NotificationEventListener.CLASS_DEDUP);
    }

    @Test
    void classStartingWithoutRoomOmitsIt() {
        LocalDateTime startsAt = LocalDateTime.of(2026, 11, 9, 8, 0);

        listener.onClassStarting(new ClassStartingEvent("u1", "s1", "Cálculo", null, startsAt));

        verify(service).notifyUnlessWithin(new NotificationRequest(NotificationType.CLASS, "u1", "s1|" + startsAt,
                "clase de Cálculo", startsAt), NotificationEventListener.CLASS_DEDUP);
    }

    @Test
    void eventStartingNotifiesOncePerEvent() {
        LocalDateTime startsAt = LocalDateTime.of(2026, 11, 9, 10, 0);

        listener.onEventStarting(new EventStartingEvent("u1", "ev1", "Feria", startsAt));

        verify(service).notifyUnlessWithin(new NotificationRequest(NotificationType.CLASS, "u1", "ev1|2026-11-09",
                "el evento \"Feria\"", startsAt), NotificationEventListener.CLASS_DEDUP);
    }

    @Test
    void quitHabitReminderKeepsTheQuitFlag() {
        listener.onHabitPending(new HabitPendingEvent("u1", "h1", "No fumar", LocalDate.of(2026, 11, 7), true));

        verify(service).notifyOncePerDay(new NotificationRequest(NotificationType.HABIT, "u1", "h1", "No fumar",
                LocalDate.of(2026, 11, 7).atStartOfDay(), true));
    }
}
