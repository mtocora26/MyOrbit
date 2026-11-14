package com.app.myorbit.notifications.application;

import com.app.myorbit.notifications.domain.NotificationRequest;
import com.app.myorbit.notifications.domain.NotificationType;
import org.springframework.stereotype.Component;

/** Resumen de vencidas: {@code subject} trae la cantidad de tareas. */
@Component
class OverdueNotificationFactory extends AbstractNotificationFactory {
    @Override
    public NotificationType type() {
        return NotificationType.OVERDUE;
    }

    @Override
    protected String title(NotificationRequest request) {
        return "Tareas vencidas";
    }

    @Override
    protected String message(NotificationRequest request) {
        return "1".equals(request.subject())
                ? "Tienes 1 tarea vencida sin completar"
                : "Tienes " + request.subject() + " tareas vencidas sin completar";
    }
}
