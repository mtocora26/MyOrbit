package com.app.myorbit.academic.application;

import java.util.ArrayList;
import java.util.List;

/**
 * Resumen académico del usuario: promedio ponderado por créditos y materias en riesgo.
 *
 * @param weightedAverage promedio de las notas actuales ponderado por créditos; null si ninguna materia tiene notas
 */
public record AcademicSummary(Double weightedAverage, int totalCredits, int gradedCredits, double targetGrade,
                              List<SubjectStanding> subjects, List<SubjectStanding> atRisk) {

    public record SubjectStanding(String subjectId, String name, int credits, String semester, GradeSummary grades, boolean atRisk) {
    }

    public static Builder builder(double targetGrade) {
        return new Builder(targetGrade);
    }

    public static class Builder {
        /** Una materia está en riesgo si no puede aprobar o necesita más de este promedio en lo que falta para aprobar. */
        public static final double RISK_REQUIRED_GRADE = 4.0;

        private final double targetGrade;
        private final List<SubjectStanding> subjects = new ArrayList<>();
        private double weightedPoints;
        private int totalCredits;
        private int gradedCredits;

        private Builder(double targetGrade) {
            this.targetGrade = targetGrade;
        }

        public Builder addSubject(String subjectId, String name, int credits, String semester, GradeSummary grades) {
            boolean atRisk = !grades.canPass()
                    || (grades.requiredToPass() != null && grades.requiredToPass() > RISK_REQUIRED_GRADE);
            subjects.add(new SubjectStanding(subjectId, name, credits, semester, grades, atRisk));
            totalCredits += credits;
            if (grades.currentGrade() != null) {
                gradedCredits += credits;
                weightedPoints += grades.currentGrade() * credits;
            }
            return this;
        }

        public AcademicSummary build() {
            Double average = gradedCredits > 0 ? Math.round(weightedPoints / gradedCredits * 100) / 100.0 : null;
            List<SubjectStanding> all = List.copyOf(subjects);
            return new AcademicSummary(average, totalCredits, gradedCredits, targetGrade, all,
                    all.stream().filter(SubjectStanding::atRisk).toList());
        }
    }
}
