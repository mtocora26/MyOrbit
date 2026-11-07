package com.app.myorbit.notifications.application;

import com.app.myorbit.notifications.domain.Notification;
import com.app.myorbit.notifications.domain.NotificationRequest;
import com.app.myorbit.notifications.domain.NotificationType;
import com.app.myorbit.notifications.infrastructure.NotificationRepository;
import com.app.myorbit.shared.error.NotFoundException;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
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

    private Notification notificationOf(String userId, boolean read) {
        Notification notification = new Notification();
        notification.setId("n1");
        notification.setUserId(userId);
        notification.setRead(read);
        return notification;
    }

    private NotificationService service() {
        return new NotificationService(repository, clock, allFactories);
    }

    @Test
    void listReturnsAllOrOnlyUnread() {
        Notification a = notificationOf("u1", false);
        when(repository.findByUserIdOrderByCreatedAtDesc("u1")).thenReturn(List.of(a));
        when(repository.findByUserIdAndReadFalseOrderByCreatedAtDesc("u1")).thenReturn(List.of());

        assertEquals(List.of(a), service().listByUser("u1", false));
        assertEquals(List.of(), service().listByUser("u1", true));
    }

    @Test
    void markAsReadSavesTheChange() {
        Notification n = notificationOf("u1", false);
        when(repository.findById("n1")).thenReturn(Optional.of(n));
        when(repository.save(any(Notification.class))).then(returnsFirstArg());

        assertTrue(service().markAsRead("u1", "n1").isRead());
    }

    @Test
    void markAsReadIsIdempotent() {
        when(repository.findById("n1")).thenReturn(Optional.of(notificationOf("u1", true)));

        assertTrue(service().markAsRead("u1", "n1").isRead());
        verify(repository, never()).save(any(Notification.class));
    }

    @Test
    void markAsReadHidesNotificationsOfOtherUsers() {
        when(repository.findById("n1")).thenReturn(Optional.of(notificationOf("u2", false)));

        assertThrows(NotFoundException.class, () -> service().markAsRead("u1", "n1"));
        verify(repository, never()).save(any(Notification.class));
    }

    @Test
    void markAllAsReadUpdatesOnlyUnreadAndReportsTheCount() {
        Notification a = notificationOf("u1", false);
        Notification b = notificationOf("u1", false);
        when(repository.findByUserIdAndReadFalseOrderByCreatedAtDesc("u1")).thenReturn(List.of(a, b));

        assertEquals(2, service().markAllAsRead("u1"));
        assertTrue(a.isRead() && b.isRead());
        verify(repository).saveAll(List.of(a, b));
    }

    @Test
    void markAllAsReadWithNothingPendingSavesNothing() {
        when(repository.findByUserIdAndReadFalseOrderByCreatedAtDesc("u1")).thenReturn(List.of());

        assertEquals(0, service().markAllAsRead("u1"));
        verify(repository, never()).saveAll(any());
    }

    @Test
    void countUnreadDelegatesToTheRepository() {
        when(repository.countByUserIdAndReadFalse("u1")).thenReturn(3L);

        assertEquals(3L, service().countUnread("u1"));
    }

    @Test
    void notifyOncePerDaySkipsWhenAlreadyNotifiedToday() {
        Instant startOfToday = Instant.parse("2026-11-07T00:00:00Z");
        when(repository.existsByUserIdAndTypeAndReferenceIdAndCreatedAtGreaterThanEqual("u1", NotificationType.HABIT, "h1", startOfToday))
                .thenReturn(true);

        org.junit.jupiter.api.Assertions.assertNull(
                service().notifyOncePerDay(new NotificationRequest(NotificationType.HABIT, "u1", "h1", "Leer", null)));
        verify(repository, never()).save(any(Notification.class));
    }

    @Test
    void notifyOncePerDayCreatesWhenNothingTodayYet() {
        when(repository.save(any(Notification.class))).then(returnsFirstArg());

        Notification created = service().notifyOncePerDay(new NotificationRequest(NotificationType.HABIT, "u1", "h1", "Leer", null));

        assertEquals(NotificationType.HABIT, created.getType());
        verify(repository).save(created);
    }
}
