package com.app.myorbit.academic.application;

import com.app.myorbit.academic.domain.Evaluation;
import com.app.myorbit.academic.domain.EvaluationComponent;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class WeightedGradeStrategyComponentsTest {
    private final WeightedGradeStrategy strategy = new WeightedGradeStrategy();

    private Evaluation cut(double percentage, Double direct, EvaluationComponent... components) {
        Evaluation evaluation = new Evaluation();
        evaluation.update("Corte", percentage, direct, null, List.of(components));
        return evaluation;
    }

    @Test
    void completeCutWithComponentsCountsWithItsWeightedGrade() {
        Evaluation first = cut(30, null, EvaluationComponent.of("Parcial", 70, 4.0), EvaluationComponent.of("Actividades", 30, 3.0));

        GradeSummary summary = strategy.calculate(List.of(first, cut(70, null)), 3.0);

        assertEquals(3.7, summary.currentGrade());
        assertEquals(30, summary.gradedPercentage());
        assertEquals(70, summary.remainingPercentage());
    }

    @Test
    void incompleteCutStaysPendingInsteadOfCountingItsProvisionalGrade() {
        Evaluation incomplete = cut(30, null, EvaluationComponent.of("Parcial", 70, 5.0), EvaluationComponent.of("Actividades", 30, null));

        GradeSummary summary = strategy.calculate(List.of(incomplete), 3.0);

        assertNull(summary.currentGrade());
        assertEquals(0, summary.gradedPercentage());
        assertEquals(100, summary.remainingPercentage());
    }

    @Test
    void mixesDirectAndComponentCuts() {
        Evaluation withParts = cut(40, null, EvaluationComponent.of("Parcial", 50, 3.0), EvaluationComponent.of("Taller", 50, 5.0));
        Evaluation direct = cut(60, 3.0);

        GradeSummary summary = strategy.calculate(List.of(withParts, direct), 3.5);

        assertEquals(3.4, summary.currentGrade());
        assertEquals(100, summary.gradedPercentage());
    }
}
