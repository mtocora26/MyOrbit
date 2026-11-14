package com.app.myorbit.notifications.application;

import com.app.myorbit.academic.application.AcademicReminderService;
import com.app.myorbit.habits.application.HabitService;
import com.app.myorbit.tasks.application.TaskService;
import com.app.myorbit.users.application.UserZoneService;
import com.app.myorbit.users.application.UserZoneService.UserLocalTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.function.IntSupplier;

/**
 * Recordatorios programados. Corre cada hora y decide por usuario según su hora local, así que funciona igual con
 * el servidor en cualquier zona:
 * <ul>
 *   <li>Cada hora: tareas que vencen en un día (23-24 h) y en la próxima hora.</li>
 *   <li>A la hora de hábitos (20:00 por defecto): hábitos de hoy sin cumplir.</li>
 *   <li>A la hora de la mañana (08:00 por defecto): tareas vencidas, evaluaciones de los próximos 3 días y materias en riesgo.</li>
 * </ul>
 * Solo publica eventos; {@link NotificationEventListener} los convierte en notificaciones sin repetirlos.
 * Se desactiva con {@code myorbit.reminders.enabled=false}; las horas con {@code myorbit.reminders.hour} y
 * {@code myorbit.reminders.habit-hour}.
 */
@Component
@ConditionalOnProperty(name = "myorbit.reminders.enabled", havingValue = "true", matchIfMissing = true)
public class ReminderScheduler {
    static final Duration DAY_BEFORE = Duration.ofHours(24);
    static final Duration DAY_BEFORE_START = Duration.ofHours(23);
    static final Duration HOUR_BEFORE = Duration.ofHours(1);
    static final Duration EXAM_WINDOW = Duration.ofDays(3);
    private static final Logger log = LoggerFactory.getLogger(ReminderScheduler.class);

    private final HabitService habitService;
    private final TaskService taskService;
    private final UserZoneService userZone;
    private final AcademicReminderService academic;
    private final int morningHour;
    private final int habitHour;

    public ReminderScheduler(HabitService habitService, TaskService taskService, UserZoneService userZone,
                             AcademicReminderService academic,
                             @Value("${myorbit.reminders.hour:8}") int morningHour,
                             @Value("${myorbit.reminders.habit-hour:20}") int habitHour) {
        this.habitService = habitService;
        this.taskService = taskService;
        this.userZone = userZone;
        this.academic = academic;
        this.morningHour = morningHour;
        this.habitHour = habitHour;
    }

    @Scheduled(cron = "${myorbit.reminders.cron:0 0 * * * *}")
    public void run() {
        List<UserLocalTime> users;
        try {
            users = userZone.activeUsersLocalTime();
        } catch (RuntimeException e) {
            log.warn("No se pudieron cargar los usuarios para los recordatorios", e);
            return;
        }
        for (UserLocalTime user : users) {
            LocalDateTime local = user.now().toLocalDateTime();
            String id = user.userId();
            runSafely("tareas que vencen en un día", id, () -> taskService.publishDueSoon(id, local.plus(DAY_BEFORE_START), local.plus(DAY_BEFORE), false));
            runSafely("tareas que vencen en una hora", id, () -> taskService.publishDueSoon(id, local, local.plus(HOUR_BEFORE), true));
            if (local.getHour() == habitHour) {
                runSafely("hábitos pendientes", id, () -> habitService.publishPendingHabits(id, local.toLocalDate()));
            }
            if (local.getHour() == morningHour) {
                runSafely("tareas vencidas", id, () -> taskService.publishOverdue(id, local));
                runSafely("evaluaciones próximas", id, () -> academic.publishExamsSoon(id, local, local.plus(EXAM_WINDOW)));
                runSafely("materias en riesgo", id, () -> academic.publishSubjectsAtRisk(id, local.toLocalDate()));
            }
        }
    }

    /** Un fallo en un recordatorio de un usuario no debe impedir los demás ni detener la programación. */
    private void runSafely(String name, String userId, IntSupplier job) {
        try {
            int count = job.getAsInt();
            if (count > 0) log.info("Recordatorio de {} para {}: {} aviso(s)", name, userId, count);
        } catch (RuntimeException e) {
            log.warn("Falló el recordatorio de {} para {}", name, userId, e);
        }
    }
}
