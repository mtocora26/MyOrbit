package com.app.myorbit.academic.domain;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EvaluationTest {
    @Test
    void updateTrimsNameAndAllowsMissingGrade() {
        Evaluation evaluation = new Evaluation();
        evaluation.update("  Parcial 1 ", 30, null);

        assertEquals("Parcial 1", evaluation.getName());
        assertFalse(evaluation.isGraded());
        evaluation.update("Parcial 1", 30, 4.5);
        assertTrue(evaluation.isGraded());
    }

    @Test
    void updateRejectsInvalidValues() {
        Evaluation evaluation = new Evaluation();
        assertThrows(IllegalArgumentException.class, () -> evaluation.update(" ", 30, null));
        assertThrows(IllegalArgumentException.class, () -> evaluation.update("P", 0, null));
        assertThrows(IllegalArgumentException.class, () -> evaluation.update("P", 100.5, null));
        assertThrows(IllegalArgumentException.class, () -> evaluation.update("P", 30, 5.1));
        assertThrows(IllegalArgumentException.class, () -> evaluation.update("P", 30, -0.1));
    }
}
