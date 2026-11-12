package com.app.myorbit.academic.domain;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SemesterTest {
    private static final LocalDate START = LocalDate.of(2026, 2, 1);
    private static final LocalDate END = LocalDate.of(2026, 6, 15);

    private Semester semester(LocalDate start, LocalDate end) {
        Semester semester = new Semester();
        semester.update("2026-1", start, end);
        return semester;
    }

    @Test
    void containsIncludesBothEnds() {
        Semester semester = semester(START, END);
        assertTrue(semester.contains(START));
        assertTrue(semester.contains(END));
        assertTrue(semester.contains(LocalDate.of(2026, 4, 1)));
        assertFalse(semester.contains(START.minusDays(1)));
        assertFalse(semester.contains(END.plusDays(1)));
    }

    @Test
    void withoutDatesIsNeverCurrent() {
        Semester semester = semester(null, null);
        assertFalse(semester.hasDates());
        assertFalse(semester.contains(LocalDate.of(2026, 4, 1)));
        assertFalse(semester(START, null).hasDates());
    }

    @Test
    void rejectsEndBeforeStart() {
        assertThrows(IllegalArgumentException.class, () -> semester(END, START));
    }

    @Test
    void rejectsInvalidName() {
        Semester semester = new Semester();
        assertThrows(IllegalArgumentException.class, () -> semester.update("2026-3", null, null));
        assertThrows(IllegalArgumentException.class, () -> semester.update(" ", null, null));
        assertThrows(IllegalArgumentException.class, () -> semester.update(null, null, null));
    }
}
