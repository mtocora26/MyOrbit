package com.app.myorbit.academic.domain;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SubjectTest {
    @Test
    void updateTrimsTheName() {
        Subject subject = new Subject();

        subject.update("  Analisis Numerico ", 3, "2026-1", "#7A5AF8");

        assertEquals("Analisis Numerico", subject.getName());
        assertEquals(3, subject.getCredits());
    }

    @Test
    void updateRejectsCreditsOutOfRange() {
        Subject subject = new Subject();

        assertThrows(IllegalArgumentException.class, () -> subject.update("Redes", 0, "2026-1", "#7A5AF8"));
        assertThrows(IllegalArgumentException.class, () -> subject.update("Redes", 21, "2026-1", "#7A5AF8"));
    }

    @Test
    void hasNameIgnoresCaseAndSurroundingSpaces() {
        Subject subject = new Subject();
        subject.update("Redes", 3, "2026-1", "#7A5AF8");

        assertTrue(subject.hasName(" redes "));
        assertFalse(subject.hasName("Redes II"));
    }
}
