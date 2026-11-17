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
import static org.junit.jupiter.api.Assertions.assertTrue;

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
    void overduePluralizesTheCount() {
        assertEquals("Tienes 1 tarea vencida sin completar", message(new OverdueNotificationFactory(), "1", null));
        assertEquals("Tienes 3 tareas vencidas sin completar", message(new OverdueNotificationFactory(), "3", null));
        assertEquals(NotificationType.OVERDUE, new OverdueNotificationFactory().type());
    }

    @Test
    void examShowsTheDate() {
        assertEquals("\"Parcial 1 (Cálculo)\" es el 10/11/2026 08:00",
                message(new ExamNotificationFactory(), "Parcial 1 (Cálculo)", LocalDateTime.of(2026, 11, 10, 8, 0)));
    }

    @Test
    void atRiskNamesTheSubject() {
        assertTrue(message(new AtRiskNotificationFactory(), "Cálculo", null).contains("\"Cálculo\""));
    }

    @Test
    void classMessageSaysWhatStartsAndWhen() {
        assertEquals("Tienes clase de Cálculo en A-101 a las 08:00",
                message(new ClassNotificationFactory(), "clase de Cálculo en A-101", LocalDateTime.of(2026, 11, 9, 8, 0)));
        assertEquals(NotificationType.CLASS, new ClassNotificationFactory().type());
    }

    @Test
    void reminderMessageIsTheTextTheUserWrote() {
        assertEquals("Llamar al banco",
                message(new PersonalReminderNotificationFactory(), "Llamar al banco", LocalDateTime.of(2026, 11, 9, 8, 0)));
        assertEquals(NotificationType.REMINDER, new PersonalReminderNotificationFactory().type());
    }

    private static String message(NotificationFactory factory, String subject, LocalDateTime when) {
        return factory.create(new NotificationRequest(factory.type(), "u1", "ref1", subject, when), NOW).getMessage();
    }

    @Test
    void quitHabitAsksWhetherTheUserAvoidedItToday() {
        Notification n = new HabitNotificationFactory().create(
                new NotificationRequest(NotificationType.HABIT, "u1", "ref1", "No fumar", LocalDateTime.of(2026, 11, 7, 0, 0), true), NOW);

        assertEquals("Hábito para dejar", n.getTitle());
        assertEquals("¿Hoy lo evitaste? Marca \"No fumar\" si lo lograste", n.getMessage());
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
                new DeadlineNotificationFactory(), new HabitNotificationFactory(), new OverdueNotificationFactory(), new ExamNotificationFactory(), new AtRiskNotificationFactory(), new ClassNotificationFactory(), new PersonalReminderNotificationFactory()}) {
            Notification n = build(factory, null);

            assertNotNull(n.getId());
            assertEquals("u1", n.getUserId());
            assertEquals("ref1", n.getReferenceId());
            assertEquals(NOW, n.getCreatedAt());
            assertFalse(n.isRead());
        }
    }
}
