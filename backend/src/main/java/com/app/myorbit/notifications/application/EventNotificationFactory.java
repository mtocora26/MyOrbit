package com.app.myorbit.notifications.application;

import com.app.myorbit.notifications.domain.NotificationRequest;
import com.app.myorbit.notifications.domain.NotificationType;
import org.springframework.stereotype.Component;

@Component
class EventNotificationFactory extends AbstractNotificationFactory {
    @Override
    public NotificationType type() {
        return NotificationType.EVENT;
    }

    @Override
    protected String title(NotificationRequest request) {
        return "Tarea completada";
    }

    @Override
    protected String message(NotificationRequest request) {
        return "Completaste \"" + request.subject() + "\". ¡Buen trabajo!";
    }
}
