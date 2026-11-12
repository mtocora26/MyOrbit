package com.app.myorbit.academic.application;

import com.app.myorbit.academic.domain.Evaluation;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class WeightedGradeStrategy implements GradeStrategy {
    private static final double EPSILON = 1e-9;

    /** Lo que falta para llegar a una nota final: el promedio necesario en lo pendiente (null si no queda nada) y si se alcanza. */
    private record Goal(Double required, boolean reachable) {
    }

    @Override
    public GradeSummary calculate(List<Evaluation> evaluations, double targetGrade, double passingGrade) {
        double gradedPercentage = 0;
        double points = 0;
        for (Evaluation evaluation : evaluations) {
            if (!evaluation.isGraded()) continue;
            gradedPercentage += evaluation.getPercentage();
            points += evaluation.effectiveGrade() * evaluation.getPercentage() / 100;
        }
        double remaining = Math.max(0, Evaluation.MAX_PERCENTAGE - gradedPercentage);
        Double current = gradedPercentage > EPSILON ? round(points * 100 / gradedPercentage) : null;
        Goal target = goal(points, remaining, targetGrade);
        Goal passing = goal(points, remaining, passingGrade);
        return new GradeSummary(current, round(points), round(gradedPercentage), round(remaining), targetGrade,
                target.required(), target.reachable(), passingGrade, passing.required(), passing.reachable());
    }

    private Goal goal(double points, double remaining, double finalGrade) {
        if (remaining > EPSILON) {
            double needed = Math.max(0, (finalGrade - points) * 100 / remaining);
            return new Goal(round(needed), needed <= Evaluation.MAX_GRADE + EPSILON);
        }
        return new Goal(null, points + EPSILON >= finalGrade);
    }

    private double round(double value) {
        return Math.round(value * 100) / 100.0;
    }
}
