package com.app.myorbit.notifications.application;

import com.app.myorbit.notifications.domain.Notification;
import com.app.myorbit.notifications.domain.NotificationRequest;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * Creador base: arma los campos comunes y delega en {@link #title} y {@link #message} (los factory
 * methods) lo que cambia por tipo. Un tipo nuevo es una subclase nueva, sin tocar las existentes.
 */
abstract class AbstractNotificationFactory implements NotificationFactory {
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Override
    public final Notification create(NotificationRequest request, Instant now) {
        Notification notification = new Notification();
        notification.setId(UUID.randomUUID().toString());
        notification.setUserId(request.userId());
        notification.setType(type());
        notification.setReferenceId(request.referenceId());
        notification.setTitle(title(request));
        notification.setMessage(message(request));
        notification.setCreatedAt(now);
        notification.setRead(false);
        return notification;
    }

    protected abstract String title(NotificationRequest request);

    protected abstract String message(NotificationRequest request);

    /** Fecha legible; omite la hora cuando es medianoche (fecha sin hora). */
    protected static String format(LocalDateTime when) {
        return when.toLocalTime().equals(java.time.LocalTime.MIDNIGHT) ? DATE.format(when) : DATE_TIME.format(when);
    }
}
