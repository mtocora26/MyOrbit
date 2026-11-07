package com.app.myorbit.tasks.domain;

/** Se publica cuando una tarea pasa de pendiente a completada (no al re-marcar una ya completada). */
public record TaskCompletedEvent(String userId, String taskId, String title) {
}
