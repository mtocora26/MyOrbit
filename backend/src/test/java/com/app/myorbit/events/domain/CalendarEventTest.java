package com.app.myorbit.events.domain;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CalendarEventTest {
    private static final LocalDate MON = LocalDate.of(2026, 3, 2);
    private static final LocalDate FRI = LocalDate.of(2026, 3, 6);

    private CalendarEvent event(String title, LocalDate start, LocalDate end, String startTime, String endTime) {
        CalendarEvent event = new CalendarEvent();
        event.update(title, start, end, startTime, endTime);
        return event;
    }

    @Test
    void withoutEndDateItIsASingleDay() {
        CalendarEvent single = event("  Entrega final ", MON, null, null, null);

        assertEquals("Entrega final", single.getTitle());
        assertEquals(MON, single.getEndDate());
        assertFalse(single.isMultiDay());
        assertNull(single.getStartTime());
        assertNull(single.getEndTime());
    }

    @Test
    void aRangeOfSeveralDaysIsMultiDay() {
        CalendarEvent week = event("Semana de parciales", MON, FRI, null, null);

        assertTrue(week.isMultiDay());
        assertEquals(FRI, week.getEndDate());
        assertFalse(event("Un día", MON, MON, null, null).isMultiDay());
    }

    @Test
    void titleAndStartDateAreRequired() {
        assertThrows(IllegalArgumentException.class, () -> event(" ", MON, null, null, null));
        assertThrows(IllegalArgumentException.class, () -> event(null, MON, null, null, null));
        assertThrows(IllegalArgumentException.class, () -> event("x".repeat(CalendarEvent.MAX_TITLE_LENGTH + 1), MON, null, null, null));
        assertThrows(IllegalArgumentException.class, () -> event("Parcial", null, null, null, null));
        assertEquals(CalendarEvent.MAX_TITLE_LENGTH, event("x".repeat(CalendarEvent.MAX_TITLE_LENGTH), MON, null, null, null).getTitle().length());
    }

    @Test
    void endDateCannotBeBeforeTheStart() {
        assertThrows(IllegalArgumentException.class, () -> event("Parcial", FRI, MON, null, null));
    }

    @Test
    void durationIsBoundedInclusive() {
        LocalDate lastAllowed = MON.plusDays(CalendarEvent.MAX_DAYS - 1);

        assertEquals(lastAllowed, event("Todo el año", MON, lastAllowed, null, null).getEndDate());
        assertThrows(IllegalArgumentException.class, () -> event("Demasiado", MON, lastAllowed.plusDays(1), null, null));
    }

    @Test
    void timesAreOptionalNormalizedHourMinute() {
        CalendarEvent timed = event("Parcial", MON, null, "08:00", "10:30");

        assertEquals("08:00", timed.getStartTime());
        assertEquals("10:30", timed.getEndTime());
        assertEquals("09:00", event("Parcial", MON, null, "09:00", null).getStartTime());
        assertNull(event("Parcial", MON, null, "  ", "  ").getStartTime());
    }

    @Test
    void invalidTimesAreRejected() {
        assertThrows(IllegalArgumentException.class, () -> event("Parcial", MON, null, "8:00", null));
        assertThrows(IllegalArgumentException.class, () -> event("Parcial", MON, null, "25:00", null));
        assertThrows(IllegalArgumentException.class, () -> event("Parcial", MON, null, "08:60", null));
        assertThrows(IllegalArgumentException.class, () -> event("Parcial", MON, null, "08:00", "noon"));
    }

    @Test
    void anEndTimeNeedsAStartTime() {
        assertThrows(IllegalArgumentException.class, () -> event("Parcial", MON, null, null, "10:00"));
    }

    @Test
    void onASingleDayTheEndTimeMustBeAfterTheStart() {
        assertThrows(IllegalArgumentException.class, () -> event("Parcial", MON, null, "10:00", "10:00"));
        assertThrows(IllegalArgumentException.class, () -> event("Parcial", MON, MON, "10:00", "09:00"));
    }

    @Test
    void onSeveralDaysTheTimesBelongToDifferentDaysSoNoOrderIsNeeded() {
        // Empieza el lunes a las 18:00 y termina el viernes a las 08:00.
        CalendarEvent retreat = event("Retiro", MON, FRI, "18:00", "08:00");

        assertEquals("18:00", retreat.getStartTime());
        assertEquals("08:00", retreat.getEndTime());
    }

    @Test
    void overlapsCountsAnyDayInsideTheRangeBothEndsIncluded() {
        CalendarEvent week = event("Parcial", MON, FRI, null, null);

        assertTrue(week.overlaps(MON, MON));
        assertTrue(week.overlaps(FRI, FRI));
        assertTrue(week.overlaps(LocalDate.of(2026, 3, 4), LocalDate.of(2026, 3, 4)));
        assertTrue(week.overlaps(MON.minusDays(10), MON), "el rango termina justo el día en que empieza");
        assertTrue(week.overlaps(FRI, FRI.plusDays(10)));
        assertTrue(week.overlaps(MON.minusDays(3), FRI.plusDays(3)), "el rango contiene al evento");
        assertFalse(week.overlaps(MON.minusDays(10), MON.minusDays(1)));
        assertFalse(week.overlaps(FRI.plusDays(1), FRI.plusDays(10)));
        assertTrue(week.overlaps(null, null));
        assertTrue(week.overlaps(FRI, null));
        assertFalse(week.overlaps(FRI.plusDays(1), null));
        assertTrue(week.overlaps(null, MON));
        assertFalse(week.overlaps(null, MON.minusDays(1)));
    }
}
