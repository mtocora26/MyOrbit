package com.app.myorbit.tasks.domain;

import java.time.LocalDateTime;

/** Se publica cuando el usuario crea una tarea. {@code due} puede ser null. */
public record TaskCreatedEvent(String userId, String taskId, String title, LocalDateTime due) {
}
