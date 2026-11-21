package com.app.myorbit.tasks.api;

import jakarta.validation.constraints.Size;
import java.time.Instant;
import com.app.myorbit.tasks.domain.Priority;

/**
 * {@code clientTime}: momento en que el usuario hizo el cambio (si lo hizo sin conexión). Si la tarea cambió después,
 * el servidor responde 409 y no aplica nada.
 * {@code subjectId}: null no cambia la materia; cadena vacía quita el vínculo; un id vincula esa materia.
 */
public record UpdateTaskRequest(
        @Size(max = 200, message = "El titulo es demasiado largo") String title,
        String due, Priority priority,
        String categoryId,
        String subjectId,
        Instant clientTime) {

    /** Sin momento del cliente: el cambio se toma como hecho ahora. */
    public UpdateTaskRequest(String title, String due, Priority priority, String categoryId, String subjectId) {
        this(title, due, priority, categoryId, subjectId, null);
    }

    /** Sin cambiar la materia. */
    public UpdateTaskRequest(String title, String due, Priority priority, String categoryId) {
        this(title, due, priority, categoryId, null, null);
    }
}
