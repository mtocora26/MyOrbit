package com.app.myorbit.notifications.application;

import com.app.myorbit.notifications.domain.Notification;
import com.app.myorbit.notifications.domain.NotificationRequest;
import com.app.myorbit.notifications.domain.NotificationType;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class NotificationFactoryTest {
    private static final Instant NOW = Instant.parse("2026-11-07T12:00:00Z");

    private Notification build(NotificationFactory factory, LocalDateTime when) {
        return factory.create(new NotificationRequest(factory.type(), "u1", "ref1", "Estudiar", when), NOW);
    }

    @Test
    void deadlineMentionsTheDueDateAndTimeWhenPresent() {
        Notification n = build(new DeadlineNotificationFactory(), LocalDateTime.of(2026, 11, 10, 18, 30));

        assertEquals(NotificationType.DEADLINE, n.getType());
        assertEquals("La tarea \"Estudiar\" vence el 10/11/2026 18:30", n.getMessage());
    }

    @Test
    void deadlineOmitsTimeAtMidnightAndHandlesMissingDate() {
        assertEquals("La tarea \"Estudiar\" vence el 10/11/2026",
                build(new DeadlineNotificationFactory(), LocalDateTime.of(2026, 11, 10, 0, 0)).getMessage());
        assertEquals("La tarea \"Estudiar\" tiene una fecha límite",
                build(new DeadlineNotificationFactory(), null).getMessage());
    }

    @Test
    void eventCongratulatesTheCompletion() {
        Notification n = build(new EventNotificationFactory(), null);

        assertEquals(NotificationType.EVENT, n.getType());
        assertEquals("Tarea completada", n.getTitle());
        assertEquals("Completaste \"Estudiar\". ¡Buen trabajo!", n.getMessage());
    }

    @Test
    void habitRemindsThePendingHabitOfTheDay() {
        Notification n = build(new HabitNotificationFactory(), LocalDateTime.of(2026, 11, 7, 0, 0));

        assertEquals(NotificationType.HABIT, n.getType());
        assertEquals("Aún no has cumplido el hábito \"Estudiar\" de hoy (07/11/2026)", n.getMessage());
    }

    @Test
    void everyNotificationStartsUnreadWithCommonFields() {
        for (NotificationFactory factory : new NotificationFactory[]{
                new DeadlineNotificationFactory(), new EventNotificationFactory(), new HabitNotificationFactory()}) {
            Notification n = build(factory, null);

            assertNotNull(n.getId());
            assertEquals("u1", n.getUserId());
            assertEquals("ref1", n.getReferenceId());
            assertEquals(NOW, n.getCreatedAt());
            assertFalse(n.isRead());
        }
    }
}
