package com.app.myorbit.academic.domain;

import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ScheduleTest {
    private static ClassSlot slot(int day, String start, String end) {
        return ClassSlot.of(day, start, end, null);
    }

    private static Subject subject(ClassSlot... slots) {
        Subject subject = new Subject();
        subject.update("Redes", 3, "2026-1", "#2E90FA", null, null, List.of(slots));
        return subject;
    }

    @Test
    void slotKeepsItsDayHoursAndTrimmedRoom() {
        ClassSlot slot = ClassSlot.of(1, "08:00", "10:00", "  Aula 301 ");

        assertEquals(1, slot.getDayOfWeek());
        assertEquals(DayOfWeek.MONDAY, slot.day());
        assertEquals(LocalTime.of(8, 0), slot.startTime());
        assertEquals(LocalTime.of(10, 0), slot.endTime());
        assertEquals("Aula 301", slot.getRoom());
        assertNull(ClassSlot.of(1, "08:00", "10:00", "   ").getRoom());
        assertNull(ClassSlot.of(1, "08:00", "10:00", null).getRoom());
    }

    @Test
    void endMustBeAfterStart() {
        assertThrows(IllegalArgumentException.class, () -> slot(1, "10:00", "10:00"));
        assertThrows(IllegalArgumentException.class, () -> slot(1, "10:00", "09:00"));
    }

    @Test
    void dayAndHoursAreValidated() {
        assertThrows(IllegalArgumentException.class, () -> slot(0, "08:00", "10:00"));
        assertThrows(IllegalArgumentException.class, () -> slot(8, "08:00", "10:00"));
        assertThrows(IllegalArgumentException.class, () -> slot(1, "8:00", "10:00"));
        assertThrows(IllegalArgumentException.class, () -> slot(1, "24:00", "25:00"));
        assertThrows(IllegalArgumentException.class, () -> slot(1, "08:60", "10:00"));
        assertThrows(IllegalArgumentException.class, () -> slot(1, null, "10:00"));
        assertThrows(IllegalArgumentException.class, () -> ClassSlot.of(1, "08:00", "10:00", "x".repeat(ClassSlot.MAX_ROOM_LENGTH + 1)));
    }

    @Test
    void overlapRequiresTheSameDayAndCrossingHours() {
        ClassSlot monday = slot(1, "08:00", "10:00");

        assertTrue(monday.overlaps(slot(1, "09:00", "11:00")));
        assertTrue(monday.overlaps(slot(1, "08:30", "09:00")));
        assertTrue(monday.overlaps(slot(1, "07:00", "08:01")));
        assertFalse(monday.overlaps(slot(1, "10:00", "12:00")), "terminar justo cuando empieza la otra no es solaparse");
        assertFalse(monday.overlaps(slot(1, "06:00", "08:00")));
        assertFalse(monday.overlaps(slot(2, "08:00", "10:00")), "otro día");
    }

    @Test
    void subjectAcceptsSeveralNonOverlappingSlots() {
        Subject subject = subject(slot(1, "08:00", "10:00"), slot(1, "10:00", "12:00"), slot(3, "08:00", "10:00"));

        assertEquals(3, subject.getSchedule().size());
    }

    @Test
    void subjectRejectsOverlappingSlotsNamingThem() {
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> subject(slot(1, "08:00", "10:00"), slot(3, "08:00", "10:00"), slot(1, "09:30", "11:00")));

        assertTrue(error.getMessage().contains("lunes 08:00-10:00"));
        assertTrue(error.getMessage().contains("lunes 09:30-11:00"));
    }

    @Test
    void subjectLimitsTheNumberOfSlots() {
        List<ClassSlot> many = new ArrayList<>();
        for (int day = 1; day <= 7; day++) {
            many.add(slot(day, "08:00", "09:00"));
            many.add(slot(day, "10:00", "11:00"));
        }
        Subject subject = new Subject();
        assertEquals(Subject.MAX_SLOTS, many.size());
        subject.update("Redes", 3, "2026-1", "#2E90FA", null, null, many);

        many.add(slot(1, "14:00", "15:00"));
        assertThrows(IllegalArgumentException.class, () -> subject.update("Redes", 3, "2026-1", "#2E90FA", null, null, many));
    }

    @Test
    void updateWithoutScheduleClearsIt() {
        Subject subject = subject(slot(1, "08:00", "10:00"));
        subject.update("Redes", 3, "2026-1", "#2E90FA");

        assertTrue(subject.getSchedule().isEmpty());
        subject.update("Redes", 3, "2026-1", "#2E90FA", null, null, null);
        assertTrue(subject.getSchedule().isEmpty());
    }

    @Test
    void aSubjectWithoutScheduleIsValid() {
        assertTrue(new Subject().getSchedule().isEmpty());
    }
}
