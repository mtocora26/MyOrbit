package com.app.myorbit.notifications.application;

import com.app.myorbit.notifications.domain.Notification;
import com.app.myorbit.shared.error.NotFoundException;
import com.app.myorbit.users.application.UserZoneService;
import com.app.myorbit.notifications.domain.NotificationRequest;
import com.app.myorbit.notifications.domain.NotificationType;
import com.app.myorbit.notifications.infrastructure.NotificationRepository;
import com.app.myorbit.users.domain.UserDeletedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {
    private final NotificationRepository repository;
    private final NotificationPreferencesService preferences;
    private final UserZoneService userZone;
    private final Clock clock;
    private final PushService push;
    private final Map<NotificationType, NotificationFactory> factories = new EnumMap<>(NotificationType.class);

    public NotificationService(NotificationRepository repository, NotificationPreferencesService preferences, UserZoneService userZone, Clock clock, PushService push, List<NotificationFactory> factories) {
        this.repository = repository;
        this.preferences = preferences;
        this.userZone = userZone;
        this.clock = clock;
        this.push = push;
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

    /**
     * Crea la notificación con la fábrica de su tipo y la guarda.
     *
     * @return la notificación creada, o {@code null} si el usuario desactivó ese tipo de aviso
     */
    public Notification notify(NotificationRequest request) {
        if (!preferences.isEnabled(request.userId(), request.type())) return null;
        Notification saved = repository.save(factories.get(request.type()).create(request, Instant.now(clock)));
        push.deliver(saved);
        return saved;
    }

    /**
     * Como {@link #notify} pero omite la notificación si ya se creó una igual (mismo usuario, tipo y referencia)
     * hoy (según la zona horaria del usuario): así un recordatorio que corre dos veces el mismo día no duplica avisos.
     *
     * @return la notificación creada, o {@code null} si ya existía una de hoy
     */
    public Notification notifyOncePerDay(NotificationRequest request) {
        return notifyUnlessSince(request, userZone.startOfToday(request.userId()));
    }

    /**
     * Como {@link #notify} pero omite la notificación si ya hay una igual (mismo usuario, tipo y referencia)
     * creada desde {@code since}: sirve para avisos con una ventana propia (una hora, varios días).
     *
     * @return la notificación creada, o {@code null} si ya existía una dentro de la ventana
     */
    public Notification notifyUnlessSince(NotificationRequest request, Instant since) {
        if (repository.existsByUserIdAndTypeAndReferenceIdAndCreatedAtGreaterThanEqual(
                request.userId(), request.type(), request.referenceId(), since)) {
            return null;
        }
        return notify(request);
    }

    /** Como {@link #notifyUnlessSince} con una ventana que termina ahora y dura {@code window}. */
    public Notification notifyUnlessWithin(NotificationRequest request, java.time.Duration window) {
        return notifyUnlessSince(request, Instant.now(clock).minus(window));
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

    @EventListener
    public void onUserDeleted(UserDeletedEvent event) {
        repository.deleteByUserId(event.userId());
    }
}
