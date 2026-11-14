package com.app.myorbit.academic.application;

import com.app.myorbit.academic.domain.ClassStartingEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/** Detecta las clases que empiezan pronto y las publica como evento; lo invoca el planificador de cada minuto. */
@Service
public class ClassReminderService {
    private final ClassAgendaService agendaService;
    private final ApplicationEventPublisher events;

    public ClassReminderService(ClassAgendaService agendaService, ApplicationEventPublisher events) {
        this.agendaService = agendaService;
        this.events = events;
    }

    /**
     * Un {@link ClassStartingEvent} por cada clase que empieza después de {@code now} y a más tardar en
     * {@code leadMinutes} minutos (hora local del usuario). Se puede llamar cada minuto: quien consume el evento no
     * repite el aviso de una misma clase.
     *
     * @return cantidad de clases detectadas
     */
    public int publishClassesStartingSoon(String userId, LocalDateTime now, int leadMinutes) {
        LocalDateTime limit = now.plusMinutes(leadMinutes);
        var starting = agendaService.between(userId, now.toLocalDate(), limit.toLocalDate()).stream()
                .filter(occurrence -> occurrence.startsAt().isAfter(now) && !occurrence.startsAt().isAfter(limit))
                .toList();
        starting.forEach(occurrence -> events.publishEvent(new ClassStartingEvent(userId, occurrence.subject().getId(),
                occurrence.subject().getName(), occurrence.slot().getRoom(), occurrence.startsAt())));
        return starting.size();
    }
}
