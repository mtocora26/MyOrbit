package com.app.myorbit.tasks.api;

import com.app.myorbit.tasks.domain.Priority;
import com.app.myorbit.tasks.domain.Task;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

/**
 * {@code subjectId}: materia vinculada; null si no pertenece a ninguna. {@code updatedAt}: momento lógico del último
 * cambio. {@code completedAt}: cuándo se completó; null si está pendiente o se completó antes de registrarlo.
 */
public record TaskResponse(String id, String userId, String title, LocalDateTime due, Priority priority, String categoryId,
                           boolean done, List<SubtaskResponse> subtasks, String subjectId, Instant updatedAt,
                           Instant completedAt) {
    public static TaskResponse from(Task task) {
        return new TaskResponse(task.getId(), task.getUserId(), task.getTitle(), task.getDue(), task.getPriority(),
                task.getCategoryId(), task.isDone(), task.getSubtasks().stream().map(SubtaskResponse::from).toList(), task.getSubjectId(), task.getUpdatedAt(), task.getCompletedAt());
    }
}
