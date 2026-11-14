package com.app.myorbit.notifications.application;

import com.app.myorbit.academic.application.ClassReminderService;
import com.app.myorbit.events.application.EventReminderService;
import com.app.myorbit.users.application.UserZoneService;
import com.app.myorbit.users.application.UserZoneService.UserLocalTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.function.IntSupplier;

/**
 * Avisos que dependen del minuto: «tienes clase en media hora» y «tu evento empieza ahora». Corre cada minuto y usa
 * la hora local de cada usuario. Cada aviso se detecta en varios ticks seguidos (la ventana de una clase dura
 * {@value #CLASS_LEAD_MINUTES} minutos); {@link NotificationEventListener} lo deduplica por ocurrencia, así que
 * se envía una sola vez y aun así sobrevive a un tick perdido (p. ej. un servidor gratuito que se durmió).
 * Se desactiva con {@code myorbit.reminders.enabled=false}.
 */
@Component
@ConditionalOnProperty(name = "myorbit.reminders.enabled", havingValue = "true", matchIfMissing = true)
public class ClassReminderScheduler {
    static final int CLASS_LEAD_MINUTES = 30;
    static final int EVENT_GRACE_MINUTES = 5;
    private static final Logger log = LoggerFactory.getLogger(ClassReminderScheduler.class);

    private final ClassReminderService classes;
    private final EventReminderService events;
    private final UserZoneService userZone;

    public ClassReminderScheduler(ClassReminderService classes, EventReminderService events, UserZoneService userZone) {
        this.classes = classes;
        this.events = events;
        this.userZone = userZone;
    }

    @Scheduled(cron = "${myorbit.reminders.class-cron:0 * * * * *}")
    public void run() {
        List<UserLocalTime> users;
        try {
            users = userZone.activeUsersLocalTime();
        } catch (RuntimeException e) {
            log.warn("No se pudieron cargar los usuarios para los avisos de clase", e);
            return;
        }
        for (UserLocalTime user : users) {
            LocalDateTime local = user.now().toLocalDateTime();
            String id = user.userId();
            runSafely("clases próximas", id, () -> classes.publishClassesStartingSoon(id, local, CLASS_LEAD_MINUTES));
            runSafely("eventos que empiezan", id, () -> events.publishEventsStarting(id, local, EVENT_GRACE_MINUTES));
        }
    }

    /** Un fallo con un usuario no debe impedir los demás ni detener la programación. */
    private void runSafely(String name, String userId, IntSupplier job) {
        try {
            job.getAsInt();
        } catch (RuntimeException e) {
            log.warn("Falló el aviso de {} para {}", name, userId, e);
        }
    }
}
