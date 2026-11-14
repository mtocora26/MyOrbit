package com.app.myorbit.events.application;

import com.app.myorbit.events.domain.EventStartingEvent;
import com.app.myorbit.events.infrastructure.CalendarEventRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;

/** Detecta los eventos con hora que están empezando y los publica; lo invoca el planificador de cada minuto. */
@Service
public class EventReminderService {
    private final CalendarEventRepository repository;
    private final ApplicationEventPublisher events;

    public EventReminderService(CalendarEventRepository repository, ApplicationEventPublisher events) {
        this.repository = repository;
        this.events = events;
    }

    /**
     * Un {@link EventStartingEvent} por cada evento cuyo primer día tiene hora de inicio dentro de
     * ({@code now} − {@code graceMinutes}, {@code now}]. La holgura cubre un tick perdido; el aviso no se repite
     * porque quien consume el evento lo deduplica por evento.
     *
     * @return cantidad de eventos detectados
     */
    public int publishEventsStarting(String userId, LocalDateTime now, int graceMinutes) {
        LocalDateTime since = now.minusMinutes(graceMinutes);
        int count = 0;
        for (var event : repository.findByUserId(userId)) {
            if (event.getStartTime() == null) continue;
            LocalDateTime startsAt = event.getStartDate().atTime(LocalTime.parse(event.getStartTime()));
            if (startsAt.isAfter(since) && !startsAt.isAfter(now)) {
                events.publishEvent(new EventStartingEvent(userId, event.getId(), event.getTitle(), startsAt));
                count++;
            }
        }
        return count;
    }
}
