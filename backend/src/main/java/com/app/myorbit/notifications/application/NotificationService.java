package com.app.myorbit.notifications.application;

import com.app.myorbit.notifications.domain.Notification;
import com.app.myorbit.shared.error.NotFoundException;
import com.app.myorbit.notifications.domain.NotificationRequest;
import com.app.myorbit.notifications.domain.NotificationType;
import com.app.myorbit.notifications.infrastructure.NotificationRepository;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {
    private final NotificationRepository repository;
    private final Clock clock;
    private final Map<NotificationType, NotificationFactory> factories = new EnumMap<>(NotificationType.class);

    public NotificationService(NotificationRepository repository, Clock clock, List<NotificationFactory> factories) {
        this.repository = repository;
        this.clock = clock;
        for (NotificationFactory factory : factories) {
            if (this.factories.put(factory.type(), factory) != null) {
                throw new IllegalStateException("Hay más de una fábrica para el tipo " + factory.type());
            }
        }
        for (NotificationType type : NotificationType.values()) {
            if (!this.factories.containsKey(type)) {
                throw new IllegalStateException("Falta la fábrica de notificaciones para el tipo " + type);
            }
        }
    }

    /** Crea la notificación con la fábrica de su tipo y la guarda. */
    public Notification notify(NotificationRequest request) {
        return repository.save(factories.get(request.type()).create(request, Instant.now(clock)));
    }

    /**
     * Como {@link #notify} pero omite la notificación si ya se creó una igual (mismo usuario, tipo y referencia)
     * hoy: así un recordatorio que corre dos veces el mismo día no duplica avisos.
     *
     * @return la notificación creada, o {@code null} si ya existía una de hoy
     */
    public Notification notifyOncePerDay(NotificationRequest request) {
        Instant startOfDay = LocalDate.now(clock).atStartOfDay(clock.getZone()).toInstant();
        if (repository.existsByUserIdAndTypeAndReferenceIdAndCreatedAtGreaterThanEqual(
                request.userId(), request.type(), request.referenceId(), startOfDay)) {
            return null;
        }
        return notify(request);
    }

    /** Más recientes primero; con {@code unreadOnly} solo las no leídas. */
    public List<Notification> listByUser(String userId, boolean unreadOnly) {
        return unreadOnly
                ? repository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId)
                : repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long countUnread(String userId) {
        return repository.countByUserIdAndReadFalse(userId);
    }

    public Notification getOwned(String userId, String id) {
        return repository.findById(id)
                .filter(notification -> notification.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("Notificación no encontrada"));
    }

    /** Idempotente: marcar una ya leída no falla ni vuelve a guardar. */
    public Notification markAsRead(String userId, String id) {
        Notification notification = getOwned(userId, id);
        if (notification.isRead()) return notification;
        notification.setRead(true);
        return repository.save(notification);
    }

    /** @return cuántas notificaciones pasaron de no leídas a leídas */
    public int markAllAsRead(String userId) {
        List<Notification> unread = repository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId);
        if (unread.isEmpty()) return 0;
        unread.forEach(notification -> notification.setRead(true));
        repository.saveAll(unread);
        return unread.size();
    }
}
