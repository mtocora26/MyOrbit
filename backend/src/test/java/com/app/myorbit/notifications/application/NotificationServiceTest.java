package com.app.myorbit.notifications.application;

import com.app.myorbit.notifications.domain.Notification;
import com.app.myorbit.notifications.domain.NotificationRequest;
import com.app.myorbit.notifications.domain.NotificationType;
import com.app.myorbit.notifications.infrastructure.NotificationRepository;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class NotificationServiceTest {
    private final NotificationRepository repository = mock(NotificationRepository.class);
    private final Clock clock = Clock.fixed(Instant.parse("2026-11-07T12:00:00Z"), ZoneOffset.UTC);
    private final List<NotificationFactory> allFactories =
            List.of(new DeadlineNotificationFactory(), new EventNotificationFactory(), new HabitNotificationFactory());

    @Test
    void notifyUsesTheFactoryOfTheTypeAndSaves() {
        NotificationService service = new NotificationService(repository, clock, allFactories);
        when(repository.save(any(Notification.class))).then(returnsFirstArg());

        Notification saved = service.notify(new NotificationRequest(NotificationType.HABIT, "u1", "h1", "Leer", null));

        assertEquals(NotificationType.HABIT, saved.getType());
        assertEquals("Hábito pendiente", saved.getTitle());
        assertEquals(Instant.parse("2026-11-07T12:00:00Z"), saved.getCreatedAt());
        verify(repository).save(saved);
    }

    @Test
    void failsAtStartupWhenATypeHasNoFactory() {
        List<NotificationFactory> incomplete = List.of(new DeadlineNotificationFactory(), new EventNotificationFactory());

        assertThrows(IllegalStateException.class, () -> new NotificationService(repository, clock, incomplete));
    }

    @Test
    void failsAtStartupWhenATypeHasTwoFactories() {
        List<NotificationFactory> duplicated = List.of(new DeadlineNotificationFactory(), new DeadlineNotificationFactory(),
                new EventNotificationFactory(), new HabitNotificationFactory());

        assertThrows(IllegalStateException.class, () -> new NotificationService(repository, clock, duplicated));
    }
}
