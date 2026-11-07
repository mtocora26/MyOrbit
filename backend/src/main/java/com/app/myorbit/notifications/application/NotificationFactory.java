package com.app.myorbit.notifications.application;

import com.app.myorbit.notifications.domain.Notification;
import com.app.myorbit.notifications.domain.NotificationRequest;
import com.app.myorbit.notifications.domain.NotificationType;

import java.time.Instant;

/** Producto del patrón Factory Method: cada tipo de notificación aporta su propia fábrica. */
public interface NotificationFactory {
    NotificationType type();

    Notification create(NotificationRequest request, Instant now);
}
