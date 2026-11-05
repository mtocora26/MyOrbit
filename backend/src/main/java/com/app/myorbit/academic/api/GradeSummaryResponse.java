package com.app.myorbit.academic.api;

import com.app.myorbit.academic.application.GradeSummary;

public record GradeSummaryResponse(Double currentGrade, double accumulatedPoints, double gradedPercentage,
                                   double remainingPercentage, double targetGrade, Double requiredGrade, boolean achievable) {
    public static GradeSummaryResponse from(GradeSummary summary) {
        return new GradeSummaryResponse(summary.currentGrade(), summary.accumulatedPoints(), summary.gradedPercentage(),
                summary.remainingPercentage(), summary.targetGrade(), summary.requiredGrade(), summary.achievable());
    }
}
