package com.app.myorbit.tasks.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.app.myorbit.tasks.domain.Priority;

public record CreateTaskRequest(
        @NotBlank(message = "El titulo de la tarea es obligatorio") @Size(max = 200, message = "El titulo es demasiado largo") String title,
        String due, Priority priority,
        @Size(max = 50, message = "La etiqueta es demasiado larga") String tag) {
}
