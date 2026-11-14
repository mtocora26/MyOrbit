package com.app.myorbit.academic.domain;

import java.time.LocalDateTime;

/** Evaluación sin calificar con fecha próxima; la publica el recordatorio programado. */
public record ExamSoonEvent(String userId, String evaluationId, String name, String subjectName, LocalDateTime due) {
}
