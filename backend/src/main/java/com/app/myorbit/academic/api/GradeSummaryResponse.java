package com.app.myorbit.academic.api;

import com.app.myorbit.academic.application.GradeSummary;

/**
 * {@code targetGrade}/{@code requiredGrade}/{@code achievable} miden la meta; {@code passingGrade}/{@code requiredToPass}/
 * {@code canPass} miden la nota mínima para aprobar.
 */
public record GradeSummaryResponse(Double currentGrade, double accumulatedPoints, double gradedPercentage,
                                   double remainingPercentage, double targetGrade, Double requiredGrade, boolean achievable,
                                   double passingGrade, Double requiredToPass, boolean canPass) {
    public static GradeSummaryResponse from(GradeSummary summary) {
        return new GradeSummaryResponse(summary.currentGrade(), summary.accumulatedPoints(), summary.gradedPercentage(),
                summary.remainingPercentage(), summary.targetGrade(), summary.requiredGrade(), summary.achievable(),
                summary.passingGrade(), summary.requiredToPass(), summary.canPass());
    }
}
