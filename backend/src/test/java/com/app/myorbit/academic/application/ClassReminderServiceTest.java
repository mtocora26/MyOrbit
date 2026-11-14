package com.app.myorbit.academic.application;

import com.app.myorbit.academic.application.ClassAgendaService.ClassOccurrence;
import com.app.myorbit.academic.domain.ClassSlot;
import com.app.myorbit.academic.domain.ClassStartingEvent;
import com.app.myorbit.academic.domain.Subject;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ClassReminderServiceTest {
    private static final LocalDate DAY = LocalDate.of(2026, 11, 9); // lunes

    private final ClassAgendaService agenda = mock(ClassAgendaService.class);
    private final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    private final ClassReminderService service = new ClassReminderService(agenda, events);

    private static ClassOccurrence occurrence(String start, String end, String room) {
        Subject subject = new Subject();
        subject.setId("s1");
        subject.update("Cálculo", 3, "2026-2", "#fff");
        return new ClassOccurrence(subject, ClassSlot.of(1, start, end, room), DAY);
    }

    @Test
    void publishesClassesStartingWithinTheLeadTime() {
        LocalDateTime now = DAY.atTime(7, 40);
        when(agenda.between("u1", DAY, DAY)).thenReturn(List.of(occurrence("08:00", "10:00", "A-101"), occurrence("14:00", "16:00", null)));

        assertEquals(1, service.publishClassesStartingSoon("u1", now, 30));
        verify(events).publishEvent(new ClassStartingEvent("u1", "s1", "Cálculo", "A-101", DAY.atTime(8, 0)));
    }

    @Test
    void ignoresClassesAlreadyStartedAndThoseBeyondTheLeadTime() {
        LocalDateTime now = DAY.atTime(8, 0);
        when(agenda.between("u1", DAY, DAY)).thenReturn(List.of(occurrence("08:00", "10:00", null), occurrence("09:00", "10:00", null)));

        assertEquals(0, service.publishClassesStartingSoon("u1", now, 30));
        verify(events, never()).publishEvent(any(Object.class));
    }

    @Test
    void looksIntoTomorrowWhenTheWindowCrossesMidnight() {
        LocalDateTime now = DAY.atTime(23, 50);
        when(agenda.between("u1", DAY, DAY.plusDays(1))).thenReturn(List.of());

        assertEquals(0, service.publishClassesStartingSoon("u1", now, 30));
        verify(agenda).between("u1", DAY, DAY.plusDays(1));
    }
}
