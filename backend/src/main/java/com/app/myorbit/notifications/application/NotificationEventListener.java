package com.app.myorbit.notifications.application;

import com.app.myorbit.academic.domain.ClassStartingEvent;
import com.app.myorbit.academic.domain.ExamSoonEvent;
import com.app.myorbit.academic.domain.SubjectAtRiskEvent;
import com.app.myorbit.events.domain.EventStartingEvent;
import com.app.myorbit.habits.domain.HabitPendingEvent;
import com.app.myorbit.notifications.domain.NotificationRequest;
import com.app.myorbit.notifications.domain.NotificationType;
import com.app.myorbit.tasks.domain.TaskCreatedEvent;
import com.app.myorbit.tasks.domain.TaskDueSoonEvent;
import com.app.myorbit.tasks.domain.TaskOverdueEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Observador de los eventos de dominio (#40): los traduce a notificaciones. Un fallo aquí se registra
 * pero no se propaga, para no romper la operación de tareas/hábitos que ya se guardó.
 */
@Component
public class NotificationEventListener {
    private static final Logger log = LoggerFactory.getLogger(NotificationEventListener.class);
    static final Duration IMMINENT_DEDUP = Duration.ofHours(2);
    static final Duration EXAM_DEDUP = Duration.ofDays(3);
    static final Duration CLASS_DEDUP = Duration.ofDays(1);
    static final Duration AT_RISK_DEDUP = Duration.ofDays(7);

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

    /** Recordatorio de vencimiento: «un día antes» una vez por día y tarea; «una hora antes» una vez por hora. */
    @EventListener
    public void onTaskDueSoon(TaskDueSoonEvent event) {
        NotificationRequest request = new NotificationRequest(NotificationType.DEADLINE, event.userId(), event.taskId(), event.title(), event.due());
        if (event.imminent()) send(request, Window.within(IMMINENT_DEDUP));
        else send(request, Window.TODAY);
    }

    /** Resumen de vencidas: una vez por día (la referencia es fija, no hay una tarea de origen). */
    @EventListener
    public void onTaskOverdue(TaskOverdueEvent event) {
        send(new NotificationRequest(NotificationType.OVERDUE, event.userId(), "overdue", String.valueOf(event.count()), null), Window.TODAY);
    }

    /** Evaluación próxima: un solo aviso por evaluación dentro de su ventana de aviso. */
    @EventListener
    public void onExamSoon(ExamSoonEvent event) {
        send(new NotificationRequest(NotificationType.EXAM, event.userId(), event.evaluationId(),
                event.name() + " (" + event.subjectName() + ")", event.due()), Window.within(EXAM_DEDUP));
    }

    /** Materia en riesgo: como máximo un aviso por semana y materia. */
    @EventListener
    public void onSubjectAtRisk(SubjectAtRiskEvent event) {
        send(new NotificationRequest(NotificationType.AT_RISK, event.userId(), event.subjectId(), event.subjectName(), null), Window.within(AT_RISK_DEDUP));
    }

    /** Clase por empezar: un solo aviso por ocurrencia (materia + fecha y hora de inicio). */
    @EventListener
    public void onClassStarting(ClassStartingEvent event) {
        String occurrence = event.subjectId() + "|" + event.startsAt();
        String what = "clase de " + event.subjectName() + (event.room() == null ? "" : " en " + event.room());
        send(new NotificationRequest(NotificationType.CLASS, event.userId(), occurrence, what, event.startsAt()), Window.within(CLASS_DEDUP));
    }

    /** Evento con hora que empieza: un solo aviso por evento y día de inicio. */
    @EventListener
    public void onEventStarting(EventStartingEvent event) {
        String occurrence = event.eventId() + "|" + event.startsAt().toLocalDate();
        send(new NotificationRequest(NotificationType.CLASS, event.userId(), occurrence, "el evento \"" + event.title() + "\"", event.startsAt()), Window.within(CLASS_DEDUP));
    }

    /** Recordatorio de hábito: una sola vez por día y hábito. */
    @EventListener
    public void onHabitPending(HabitPendingEvent event) {
        send(new NotificationRequest(NotificationType.HABIT, event.userId(), event.habitId(), event.title(), event.date().atStartOfDay(), event.quit()), Window.TODAY);
    }

    private void send(NotificationRequest request) {
        send(request, Window.NONE);
    }

    private void send(NotificationRequest request, Window window) {
        try {
            if (window == Window.TODAY) notificationService.notifyOncePerDay(request);
            else if (window.duration != null) notificationService.notifyUnlessWithin(request, window.duration);
            else notificationService.notify(request);
        } catch (RuntimeException e) {
            log.warn("No se pudo crear la notificación {} para {}", request.type(), request.referenceId(), e);
        }
    }

    /** Ventana en la que no se repite un aviso igual: ninguna, el día de hoy del usuario o una duración. */
    private record Window(Duration duration) {
        static final Window NONE = new Window(null);
        static final Window TODAY = new Window(null);

        static Window within(Duration duration) {
            return new Window(duration);
        }
    }
}
