package com.app.myorbit.tasks.application;

import com.app.myorbit.tasks.domain.Priority;
import com.app.myorbit.tasks.domain.Task;

import java.time.LocalDateTime;

/**
 * Filtros de listado de tareas. Todo campo nulo/ausente significa "sin filtro"
 * (excepto {@code uncategorized}, que filtra las tareas sin categoría).
 */
public record TaskFilter(
        Boolean done,
        LocalDateTime dueFrom,
        LocalDateTime dueTo,
        Priority priority,
        String categoryId,
        boolean uncategorized) {

    public static TaskFilter empty() {
        return new TaskFilter(null, null, null, null, null, false);
    }

    public boolean matches(Task task) {
        if (done != null && task.isDone() != done) return false;
        if (dueFrom != null && (task.getDue() == null || task.getDue().isBefore(dueFrom))) return false;
        if (dueTo != null && (task.getDue() == null || task.getDue().isAfter(dueTo))) return false;
        if (priority != null && task.getPriority() != priority) return false;
        if (categoryId != null && !categoryId.isBlank() && !categoryId.equals(task.getCategoryId())) return false;
        if (uncategorized && task.getCategoryId() != null) return false;
        return true;
    }
}
