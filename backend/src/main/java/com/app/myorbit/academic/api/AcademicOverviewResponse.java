package com.app.myorbit.academic.api;

import java.util.List;

/** Materias y semestres del usuario en una sola respuesta (la pantalla de Universidad necesita ambos). */
public record AcademicOverviewResponse(List<SubjectResponse> subjects, List<SemesterResponse> semesters) {
}
