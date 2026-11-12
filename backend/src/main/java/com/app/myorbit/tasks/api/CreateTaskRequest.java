package com.app.myorbit.tasks.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.app.myorbit.tasks.domain.Priority;

/**
 * {@code subjectId}: materia del usuario a la que se vincula la tarea (opcional). Si se indica y no se pide una categoría,
 * la tarea queda en la categoría «Universidad» del usuario (si la tiene).
 */
public record CreateTaskRequest(
        @NotBlank(message = "El titulo de la tarea es obligatorio") @Size(max = 200, message = "El titulo es demasiado largo") String title,
        String due, Priority priority,
        String categoryId,
        String subjectId) {

    /** Sin materia. */
    public CreateTaskRequest(String title, String due, Priority priority, String categoryId) {
        this(title, due, priority, categoryId, null);
    }
}
