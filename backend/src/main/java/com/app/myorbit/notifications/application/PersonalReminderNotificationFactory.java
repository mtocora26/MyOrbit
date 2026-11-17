package com.app.myorbit.notifications.application;

import com.app.myorbit.notifications.domain.NotificationRequest;
import com.app.myorbit.notifications.domain.NotificationType;
import org.springframework.stereotype.Component;

/** Recordatorio personal: {@code subject} es el texto que escribió el usuario. */
@Component
class PersonalReminderNotificationFactory extends AbstractNotificationFactory {
    @Override
    public NotificationType type() {
        return NotificationType.REMINDER;
    }

    @Override
    protected String title(NotificationRequest request) {
        return "Recordatorio";
    }

    @Override
    protected String message(NotificationRequest request) {
        return request.subject();
    }
}
