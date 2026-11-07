package com.app.myorbit.tasks.domain;

import java.time.LocalDateTime;

/** Tarea pendiente cuyo vencimiento está próximo; lo publica el recordatorio programado. */
public record TaskDueSoonEvent(String userId, String taskId, String title, LocalDateTime due) {
}
