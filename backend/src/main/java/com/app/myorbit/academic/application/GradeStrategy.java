package com.app.myorbit.academic.application;

import com.app.myorbit.academic.domain.Evaluation;

import java.util.List;

/** Estrategia de cálculo de notas; permite otras escalas o reglas de promedio sin tocar el servicio. */
public interface GradeStrategy {
    GradeSummary calculate(List<Evaluation> evaluations, double targetGrade);
}
