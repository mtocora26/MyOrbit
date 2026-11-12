package com.app.myorbit.academic.domain;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EvaluationComponentsTest {
    private static EvaluationComponent part(String name, double percentage, Double grade) {
        return EvaluationComponent.of(name, percentage, grade);
    }

    private static Evaluation cut(Double grade, EvaluationComponent... components) {
        Evaluation evaluation = new Evaluation();
        evaluation.update("Corte 1", 30, grade, null, List.of(components));
        return evaluation;
    }

    @Test
    void cutWithoutComponentsKeepsItsDirectGrade() {
        Evaluation direct = cut(4.0);

        assertFalse(direct.hasComponents());
        assertTrue(direct.isGraded());
        assertEquals(4.0, direct.effectiveGrade());
        assertEquals(4.0, direct.provisionalGrade());
        assertNull(cut(null).effectiveGrade());
    }

    @Test
    void completeCutAveragesItsComponentsByWeight() {
        Evaluation evaluation = cut(null, part("Parcial", 70, 4.0), part("Actividades", 30, 3.0));

        assertTrue(evaluation.isComplete());
        assertTrue(evaluation.isGraded());
        assertEquals(3.7, evaluation.effectiveGrade(), 1e-9);
    }

    @Test
    void incompleteCutHasProvisionalGradeButStaysPending() {
        Evaluation evaluation = cut(null, part("Parcial", 70, 4.0), part("Actividades", 30, null));

        assertFalse(evaluation.isComplete());
        assertFalse(evaluation.isGraded());
        assertNull(evaluation.effectiveGrade());
        assertEquals(4.0, evaluation.provisionalGrade(), 1e-9);
    }

    @Test
    void componentsThatDoNotAddUpTo100AreNotComplete() {
        Evaluation evaluation = cut(null, part("Parcial", 60, 4.0), part("Actividades", 30, 3.0));

        assertFalse(evaluation.isComplete());
        assertNull(evaluation.effectiveGrade());
        assertEquals(3.6666666, evaluation.provisionalGrade(), 1e-6);
    }

    @Test
    void withoutAnyComponentGradeThereIsNoProvisionalGrade() {
        assertNull(cut(null, part("Parcial", 100, null)).provisionalGrade());
    }

    @Test
    void cutWithComponentsCannotAlsoCarryADirectGrade() {
        assertThrows(IllegalArgumentException.class, () -> cut(4.0, part("Parcial", 100, 4.0)));
    }

    @Test
    void componentPercentagesCannotExceed100() {
        assertThrows(IllegalArgumentException.class, () -> cut(null, part("A", 60, null), part("B", 50, null)));
    }

    @Test
    void componentValuesAreValidated() {
        assertThrows(IllegalArgumentException.class, () -> part(" ", 50, null));
        assertThrows(IllegalArgumentException.class, () -> part("A", 0, null));
        assertThrows(IllegalArgumentException.class, () -> part("A", 100.5, null));
        assertThrows(IllegalArgumentException.class, () -> part("A", 50, 5.1));
        assertEquals("A", part(" A ", 50, 5.0).getName());
    }

    @Test
    void updatingWithoutComponentsClearsThem() {
        Evaluation evaluation = cut(null, part("Parcial", 100, 4.0));
        evaluation.update("Corte 1", 30, 3.5);

        assertFalse(evaluation.hasComponents());
        assertEquals(3.5, evaluation.effectiveGrade());
    }
}
