package com.app.myorbit.notifications.api;

import com.app.myorbit.notifications.domain.Notification;
import com.app.myorbit.notifications.domain.NotificationType;

import java.time.Instant;

public record NotificationResponse(String id, NotificationType type, String title, String message,
                                   String referenceId, Instant createdAt, boolean read) {
    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(notification.getId(), notification.getType(), notification.getTitle(),
                notification.getMessage(), notification.getReferenceId(), notification.getCreatedAt(), notification.isRead());
    }
}
