package com.app.myorbit.academic.domain;

/** Materia del semestre en curso en riesgo de no aprobarse; la publica el recordatorio programado. */
public record SubjectAtRiskEvent(String userId, String subjectId, String subjectName) {
}
