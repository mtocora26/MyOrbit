package com.app.myorbit.tasks.api;

import jakarta.validation.constraints.Size;
import com.app.myorbit.tasks.domain.Priority;

/** {@code subjectId}: null no cambia la materia; cadena vacía quita el vínculo; un id vincula esa materia. */
public record UpdateTaskRequest(
        @Size(max = 200, message = "El titulo es demasiado largo") String title,
        String due, Priority priority,
        String categoryId,
        String subjectId) {

    /** Sin cambiar la materia. */
    public UpdateTaskRequest(String title, String due, Priority priority, String categoryId) {
        this(title, due, priority, categoryId, null);
    }
}
