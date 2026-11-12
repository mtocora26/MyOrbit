package com.app.myorbit.academic.application;

import com.app.myorbit.academic.domain.Evaluation;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class WeightedGradeStrategy implements GradeStrategy {
    private static final double EPSILON = 1e-9;

    @Override
    public GradeSummary calculate(List<Evaluation> evaluations, double targetGrade) {
        double gradedPercentage = 0;
        double points = 0;
        for (Evaluation evaluation : evaluations) {
            if (!evaluation.isGraded()) continue;
            gradedPercentage += evaluation.getPercentage();
            points += evaluation.effectiveGrade() * evaluation.getPercentage() / 100;
        }
        double remaining = Math.max(0, Evaluation.MAX_PERCENTAGE - gradedPercentage);
        Double current = gradedPercentage > EPSILON ? round(points * 100 / gradedPercentage) : null;
        Double required = null;
        boolean achievable = true;
        if (remaining > EPSILON) {
            double needed = Math.max(0, (targetGrade - points) * 100 / remaining);
            required = round(needed);
            achievable = needed <= Evaluation.MAX_GRADE + EPSILON;
        } else {
            achievable = points + EPSILON >= targetGrade;
        }
        return new GradeSummary(current, round(points), round(gradedPercentage), round(remaining), targetGrade, required, achievable);
    }

    private double round(double value) {
        return Math.round(value * 100) / 100.0;
    }
}
