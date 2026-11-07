package com.app.myorbit.notifications.application;

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
 * Recordatorios diarios: hábitos de hoy sin cumplir y tareas que vencen en las próximas 24 horas.
 * Corre cada hora y avisa a cada usuario cuando es su hora local de recordatorio (08:00 por defecto), así que
 * funciona igual con el servidor en cualquier zona. Solo publica eventos; {@link NotificationEventListener} los
 * convierte en notificaciones, sin repetir el mismo aviso dentro del día.
 * Se desactiva con {@code myorbit.reminders.enabled=false}; la hora con {@code myorbit.reminders.hour}.
 */
@Component
@ConditionalOnProperty(name = "myorbit.reminders.enabled", havingValue = "true", matchIfMissing = true)
public class ReminderScheduler {
    static final Duration DUE_SOON_WINDOW = Duration.ofHours(24);
    private static final Logger log = LoggerFactory.getLogger(ReminderScheduler.class);

    private final HabitService habitService;
    private final TaskService taskService;
    private final UserZoneService userZone;
    private final int reminderHour;

    public ReminderScheduler(HabitService habitService, TaskService taskService, UserZoneService userZone,
                             @Value("${myorbit.reminders.hour:8}") int reminderHour) {
        this.habitService = habitService;
        this.taskService = taskService;
        this.userZone = userZone;
        this.reminderHour = reminderHour;
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
            if (user.now().getHour() != reminderHour) continue;
            LocalDateTime local = user.now().toLocalDateTime();
            runSafely("hábitos pendientes", user.userId(), () -> habitService.publishPendingHabits(user.userId(), local.toLocalDate()));
            runSafely("tareas por vencer", user.userId(), () -> taskService.publishDueSoon(user.userId(), local, local.plus(DUE_SOON_WINDOW)));
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
