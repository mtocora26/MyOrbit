package com.app.myorbit.academic.api;

import java.util.List;

/** Evaluaciones de una materia y su resumen de notas en una sola respuesta. */
public record SubjectGradesResponse(List<EvaluationResponse> evaluations, GradeSummaryResponse summary) {
}
