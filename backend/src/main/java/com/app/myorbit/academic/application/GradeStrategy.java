package com.app.myorbit.academic.application;

import com.app.myorbit.academic.domain.Evaluation;

import java.util.List;

/** Estrategia de cálculo de notas; permite otras escalas o reglas de promedio sin tocar el servicio. */
public interface GradeStrategy {
    /** Calcula contra la meta y contra la nota mínima para aprobar. */
    GradeSummary calculate(List<Evaluation> evaluations, double targetGrade, double passingGrade);

    /** Aprobar coincide con la meta. */
    default GradeSummary calculate(List<Evaluation> evaluations, double targetGrade) {
        return calculate(evaluations, targetGrade, targetGrade);
    }
}
