package com.app.myorbit.events.application;

import com.app.myorbit.events.domain.CalendarEvent;
import com.app.myorbit.events.domain.EventStartingEvent;
import com.app.myorbit.events.infrastructure.CalendarEventRepository;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EventReminderServiceTest {
    private static final LocalDate DAY = LocalDate.of(2026, 11, 9);

    private final CalendarEventRepository repository = mock(CalendarEventRepository.class);
    private final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    private final EventReminderService service = new EventReminderService(repository, events);

    private static CalendarEvent event(String id, LocalDate start, String time) {
        CalendarEvent event = new CalendarEvent();
        event.setId(id);
        event.update("Feria", start, null, time, null);
        return event;
    }

    @Test
    void publishesEventsThatStartedWithinTheGraceWindow() {
        when(repository.findByUserId("u1")).thenReturn(List.of(event("e1", DAY, "10:00")));

        assertEquals(1, service.publishEventsStarting("u1", DAY.atTime(10, 2), 5));
        verify(events).publishEvent(new EventStartingEvent("u1", "e1", "Feria", DAY.atTime(10, 0)));
    }

    @Test
    void ignoresEventsNotYetStartedTooOldOrWithoutTime() {
        when(repository.findByUserId("u1")).thenReturn(List.of(
                event("future", DAY, "11:00"), event("old", DAY, "09:00"), event("allDay", DAY, null),
                event("otherDay", DAY.plusDays(1), "10:00")));

        assertEquals(0, service.publishEventsStarting("u1", DAY.atTime(10, 2), 5));
        verify(events, never()).publishEvent(any(Object.class));
    }

    @Test
    void doesNotNotifyAtTheStartOfLaterDaysOfAMultiDayEvent() {
        CalendarEvent multiDay = new CalendarEvent();
        multiDay.setId("w1");
        multiDay.update("Semana de parciales", DAY, DAY.plusDays(4), "08:00", null);
        when(repository.findByUserId("u1")).thenReturn(List.of(multiDay));

        assertEquals(0, service.publishEventsStarting("u1", DAY.plusDays(2).atTime(8, 0), 5));
    }
}
