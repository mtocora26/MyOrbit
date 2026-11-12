package com.app.myorbit.academic.domain;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class GoalsTest {
    private Subject subject(Double target, Double passing) {
        Subject subject = new Subject();
        subject.update("Redes", 3, "2026-1", "#2E90FA", target, passing);
        return subject;
    }

    @Test
    void subjectGoalsAreOptionalAndPassingFallsBackToThree() {
        Subject plain = subject(null, null);

        assertNull(plain.getTargetGrade());
        assertNull(plain.getPassingGrade());
        assertEquals(Subject.DEFAULT_PASSING_GRADE, plain.effectivePassingGrade());
        assertEquals(3.5, subject(4.5, 3.5).effectivePassingGrade());
    }

    @Test
    void subjectGoalsMustBeBetweenZeroAndFive() {
        assertThrows(IllegalArgumentException.class, () -> subject(5.1, null));
        assertThrows(IllegalArgumentException.class, () -> subject(-0.1, null));
        assertThrows(IllegalArgumentException.class, () -> subject(null, 5.1));
        assertThrows(IllegalArgumentException.class, () -> subject(null, -1.0));
    }

    @Test
    void targetCannotBeBelowThePassingGrade() {
        assertThrows(IllegalArgumentException.class, () -> subject(3.0, 3.5));
        assertEquals(3.5, subject(3.5, 3.5).getTargetGrade());
    }

    @Test
    void oldUpdateClearsTheGoals() {
        Subject subject = subject(4.5, 3.5);
        subject.update("Redes", 3, "2026-1", "#2E90FA");

        assertNull(subject.getTargetGrade());
        assertNull(subject.getPassingGrade());
    }

    @Test
    void semesterTargetAverageIsOptionalAndBounded() {
        Semester semester = new Semester();
        semester.update("2026-1", null, null, 4.0);
        assertEquals(4.0, semester.getTargetAverage());

        semester.update("2026-1", null, null);
        assertNull(semester.getTargetAverage());
        assertThrows(IllegalArgumentException.class, () -> semester.update("2026-1", null, null, 5.5));
        assertThrows(IllegalArgumentException.class, () -> semester.update("2026-1", null, null, -1.0));
    }
}
