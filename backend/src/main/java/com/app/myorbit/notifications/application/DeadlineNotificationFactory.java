package com.app.myorbit.notifications.application;

import com.app.myorbit.notifications.domain.NotificationRequest;
import com.app.myorbit.notifications.domain.NotificationType;
import org.springframework.stereotype.Component;

@Component
class DeadlineNotificationFactory extends AbstractNotificationFactory {
    @Override
    public NotificationType type() {
        return NotificationType.DEADLINE;
    }

    @Override
    protected String title(NotificationRequest request) {
        return "Fecha límite";
    }

    @Override
    protected String message(NotificationRequest request) {
        return request.when() == null
                ? "La tarea \"" + request.subject() + "\" tiene una fecha límite"
                : "La tarea \"" + request.subject() + "\" vence el " + format(request.when());
    }
}
