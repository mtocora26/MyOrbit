package com.app.myorbit.notifications.infrastructure;

import com.app.myorbit.TestcontainersConfiguration;
import com.app.myorbit.notifications.application.PersonalReminderService;
import com.app.myorbit.notifications.domain.Notification;
import com.app.myorbit.notifications.domain.NotificationType;
import com.app.myorbit.notifications.domain.PersonalReminder;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Contra un Mongo real: el recordatorio llega a la bandeja una sola vez, solo cuando su hora ya pasó. */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@Testcontainers(disabledWithoutDocker = true)
class PersonalReminderIntegrationTest {
    private static final String USER = "reminder-it-user";

    @Autowired
    private PersonalReminderService service;
    @Autowired
    private PersonalReminderRepository reminders;
    @Autowired
    private NotificationRepository notifications;

    @Test
    void dueReminderReachesTheInboxExactlyOnce() {
        LocalDateTime now = LocalDateTime.of(2026, 11, 20, 8, 30);
        PersonalReminder due = save("due-it", now.minusMinutes(1));
        PersonalReminder later = save("later-it", now.plusHours(2));
        try {
            assertEquals(1, service.fireDue(USER, now));
            assertEquals(0, service.fireDue(USER, now), "un recordatorio ya enviado no se repite");

            List<Notification> inbox = notifications.findByUserIdOrderByCreatedAtDesc(USER);
            assertEquals(1, inbox.size());
            assertEquals(NotificationType.REMINDER, inbox.get(0).getType());
            assertEquals("Llamar al banco", inbox.get(0).getMessage());
            assertEquals(due.getId(), inbox.get(0).getReferenceId());

            assertEquals(List.of(later.getId()), service.listPending(USER).stream().map(PersonalReminder::getId).toList());

            assertEquals(1, service.fireDue(USER, now.plusHours(3)));
            assertTrue(service.listPending(USER).isEmpty());
        } finally {
            reminders.deleteAll(reminders.findByUserIdAndFiredFalseOrderByRemindAtAsc(USER));
            reminders.deleteById(due.getId());
            reminders.deleteById(later.getId());
            notifications.deleteAll(notifications.findByUserIdOrderByCreatedAtDesc(USER));
        }
    }

    private PersonalReminder save(String id, LocalDateTime at) {
        PersonalReminder reminder = new PersonalReminder();
        reminder.setId(id);
        reminder.setUserId(USER);
        reminder.setText("Llamar al banco");
        reminder.setRemindAt(at);
        return reminders.save(reminder);
    }
}
