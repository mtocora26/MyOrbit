package com.app.myorbit.tasks.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import com.app.myorbit.tasks.domain.Priority;

/**
 * {@code subjectId}: materia del usuario a la que se vincula la tarea (opcional). Si se indica y no se pide una categoría,
 * la tarea queda en la categoría «Universidad» del usuario (si la tiene).
 *
 * {@code id}: UUID opcional generado por el cliente (para crear sin conexión). Reenviar la misma petición con el mismo
 * {@code id} devuelve la tarea ya creada en vez de duplicarla.
 */
public record CreateTaskRequest(
        @NotBlank(message = "El titulo de la tarea es obligatorio") @Size(max = 200, message = "El titulo es demasiado largo") String title,
        String due, Priority priority,
        String categoryId,
        String subjectId,
        @Pattern(regexp = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$", message = "El identificador de la tarea no es valido") String id) {

    /** Sin identificador del cliente: el servidor genera uno. */
    public CreateTaskRequest(String title, String due, Priority priority, String categoryId, String subjectId) {
        this(title, due, priority, categoryId, subjectId, null);
    }

    /** Sin materia. */
    public CreateTaskRequest(String title, String due, Priority priority, String categoryId) {
        this(title, due, priority, categoryId, null, null);
    }
}
