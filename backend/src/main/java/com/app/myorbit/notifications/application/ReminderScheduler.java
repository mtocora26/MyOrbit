package com.app.myorbit.notifications.application;

import com.app.myorbit.habits.application.HabitService;
import com.app.myorbit.tasks.application.TaskService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Recordatorios diarios: hábitos de hoy sin cumplir y tareas que vencen en las próximas 24 horas.
 * Solo publica eventos; {@link NotificationEventListener} los convierte en notificaciones.
 * Se desactiva con {@code myorbit.reminders.enabled=false} y su hora con {@code myorbit.reminders.cron}.
 */
@Component
@ConditionalOnProperty(name = "myorbit.reminders.enabled", havingValue = "true", matchIfMissing = true)
public class ReminderScheduler {
    static final Duration DUE_SOON_WINDOW = Duration.ofHours(24);
    private static final Logger log = LoggerFactory.getLogger(ReminderScheduler.class);

    private final HabitService habitService;
    private final TaskService taskService;
    private final Clock clock;

    public ReminderScheduler(HabitService habitService, TaskService taskService, Clock clock) {
        this.habitService = habitService;
        this.taskService = taskService;
        this.clock = clock;
    }

    @Scheduled(cron = "${myorbit.reminders.cron:0 0 8 * * *}")
    public void run() {
        runSafely("hábitos pendientes", () -> habitService.publishPendingHabits(LocalDate.now(clock)));
        LocalDateTime now = LocalDateTime.now(clock);
        runSafely("tareas por vencer", () -> taskService.publishDueSoon(now, now.plus(DUE_SOON_WINDOW)));
    }

    /** Un fallo en un recordatorio no debe impedir el otro ni detener la programación. */
    private void runSafely(String name, java.util.function.IntSupplier job) {
        try {
            log.info("Recordatorio de {}: {} aviso(s)", name, job.getAsInt());
        } catch (RuntimeException e) {
            log.warn("Falló el recordatorio de {}", name, e);
        }
    }
}
