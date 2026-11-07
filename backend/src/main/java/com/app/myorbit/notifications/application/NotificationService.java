package com.app.myorbit.notifications.application;

import com.app.myorbit.notifications.domain.Notification;
import com.app.myorbit.notifications.domain.NotificationRequest;
import com.app.myorbit.notifications.domain.NotificationType;
import com.app.myorbit.notifications.infrastructure.NotificationRepository;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
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
}
