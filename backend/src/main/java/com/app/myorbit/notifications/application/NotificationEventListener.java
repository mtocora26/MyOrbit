package com.app.myorbit.notifications.application;

import com.app.myorbit.habits.domain.HabitPendingEvent;
import com.app.myorbit.notifications.domain.NotificationRequest;
import com.app.myorbit.notifications.domain.NotificationType;
import com.app.myorbit.tasks.domain.TaskCompletedEvent;
import com.app.myorbit.tasks.domain.TaskCreatedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Observador de los eventos de dominio (#40): los traduce a notificaciones. Un fallo aquí se registra
 * pero no se propaga, para no romper la operación de tareas/hábitos que ya se guardó.
 */
@Component
public class NotificationEventListener {
    private static final Logger log = LoggerFactory.getLogger(NotificationEventListener.class);
    private final NotificationService notificationService;

    public NotificationEventListener(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /** Solo las tareas con fecha límite generan notificación al crearse. */
    @EventListener
    public void onTaskCreated(TaskCreatedEvent event) {
        if (event.due() == null) return;
        send(new NotificationRequest(NotificationType.DEADLINE, event.userId(), event.taskId(), event.title(), event.due()));
    }

    @EventListener
    public void onTaskCompleted(TaskCompletedEvent event) {
        send(new NotificationRequest(NotificationType.EVENT, event.userId(), event.taskId(), event.title(), null));
    }

    @EventListener
    public void onHabitPending(HabitPendingEvent event) {
        send(new NotificationRequest(NotificationType.HABIT, event.userId(), event.habitId(), event.title(), event.date().atStartOfDay()));
    }

    private void send(NotificationRequest request) {
        try {
            notificationService.notify(request);
        } catch (RuntimeException e) {
            log.warn("No se pudo crear la notificación {} para {}", request.type(), request.referenceId(), e);
        }
    }
}
