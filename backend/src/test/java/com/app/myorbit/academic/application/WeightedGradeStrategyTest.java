package com.app.myorbit.academic.application;

import com.app.myorbit.academic.domain.Evaluation;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WeightedGradeStrategyTest {
    private final WeightedGradeStrategy strategy = new WeightedGradeStrategy();

    private Evaluation evaluation(double percentage, Double grade) {
        Evaluation evaluation = new Evaluation();
        evaluation.update("E", percentage, grade);
        return evaluation;
    }

    @Test
    void withoutGradesThereIsNoCurrentGradeAndTheWholeSubjectRemains() {
        GradeSummary summary = strategy.calculate(List.of(evaluation(50, null)), 3.0);

        assertNull(summary.currentGrade());
        assertEquals(100, summary.remainingPercentage());
        assertEquals(3.0, summary.requiredGrade());
    }

    @Test
    void computesWeightedAverageAndRequiredGrade() {
        GradeSummary summary = strategy.calculate(List.of(evaluation(30, 4.0), evaluation(20, 3.0), evaluation(50, null)), 3.5);

        assertEquals(3.6, summary.currentGrade());
        assertEquals(1.8, summary.accumulatedPoints());
        assertEquals(50, summary.gradedPercentage());
        assertEquals(50, summary.remainingPercentage());
        assertEquals(3.4, summary.requiredGrade());
        assertTrue(summary.achievable());
    }

    @Test
    void requiredGradeAboveTheMaximumIsNotAchievable() {
        GradeSummary summary = strategy.calculate(List.of(evaluation(80, 1.0)), 3.0);

        assertEquals(11.0, summary.requiredGrade());
        assertFalse(summary.achievable());
    }

    @Test
    void alreadyReachedTargetRequiresZero() {
        GradeSummary summary = strategy.calculate(List.of(evaluation(70, 5.0)), 3.0);

        assertEquals(0.0, summary.requiredGrade());
        assertTrue(summary.achievable());
    }

    @Test
    void fullyGradedSubjectHasNoRequiredGrade() {
        GradeSummary summary = strategy.calculate(List.of(evaluation(100, 2.5)), 3.0);

        assertNull(summary.requiredGrade());
        assertFalse(summary.achievable());
    }
}
