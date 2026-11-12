package com.app.myorbit.tasks.api;

import com.app.myorbit.tasks.domain.Priority;
import com.app.myorbit.tasks.domain.Task;

import java.time.LocalDateTime;
import java.util.List;

/** {@code subjectId}: materia vinculada; null si la tarea no pertenece a ninguna. */
public record TaskResponse(String id, String userId, String title, LocalDateTime due, Priority priority, String categoryId,
                           boolean done, List<SubtaskResponse> subtasks, String subjectId) {
    public static TaskResponse from(Task task) {
        return new TaskResponse(task.getId(), task.getUserId(), task.getTitle(), task.getDue(), task.getPriority(),
                task.getCategoryId(), task.isDone(), task.getSubtasks().stream().map(SubtaskResponse::from).toList(), task.getSubjectId());
    }
}
