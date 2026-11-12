package com.app.myorbit.tasks.application;

import com.app.myorbit.tasks.domain.Priority;
import com.app.myorbit.tasks.domain.Task;

import java.time.LocalDateTime;
import java.util.Collection;

/**
 * Filtros de listado de tareas. Todo campo nulo/ausente significa "sin filtro"
 * (excepto {@code uncategorized}, que filtra las tareas sin categoría). {@code subjectId} deja solo las de esa materia.
 */
public record TaskFilter(
        Boolean done,
        LocalDateTime dueFrom,
        LocalDateTime dueTo,
        Priority priority,
        String categoryId,
        boolean uncategorized,
        String subjectId) {

    /** Sin filtro por materia. */
    public TaskFilter(Boolean done, LocalDateTime dueFrom, LocalDateTime dueTo, Priority priority, String categoryId, boolean uncategorized) {
        this(done, dueFrom, dueTo, priority, categoryId, uncategorized, null);
    }

    public static TaskFilter empty() {
        return new TaskFilter(null, null, null, null, null, false);
    }

    public boolean matches(Task task) {
        return matches(task, null);
    }

    /**
     * Igual que arriba; si {@code acceptedCategoryIds} no es null ni vacío, el filtro por categoría acepta cualquiera de
     * ellas (la categoría pedida y sus subcategorías) en vez de solo {@code categoryId}.
     */
    public boolean matches(Task task, Collection<String> acceptedCategoryIds) {
        if (done != null && task.isDone() != done) return false;
        if (dueFrom != null && (task.getDue() == null || task.getDue().isBefore(dueFrom))) return false;
        if (dueTo != null && (task.getDue() == null || task.getDue().isAfter(dueTo))) return false;
        if (priority != null && task.getPriority() != priority) return false;
        if (categoryId != null && !categoryId.isBlank()) {
            boolean expanded = acceptedCategoryIds != null && !acceptedCategoryIds.isEmpty();
            // Las colecciones inmutables (Set.of) lanzan NPE con contains(null): una tarea sin categoría nunca coincide.
            boolean inCategory = expanded
                    ? task.getCategoryId() != null && acceptedCategoryIds.contains(task.getCategoryId())
                    : categoryId.equals(task.getCategoryId());
            if (!inCategory) return false;
        }
        if (uncategorized && task.getCategoryId() != null) return false;
        if (subjectId != null && !subjectId.isBlank() && !subjectId.equals(task.getSubjectId())) return false;
        return true;
    }
}
