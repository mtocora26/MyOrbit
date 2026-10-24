package com.app.myorbit.tasks.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateSubtaskRequest(
        @NotBlank(message = "El titulo de la subtarea es obligatorio") @Size(max = 200, message = "El titulo es demasiado largo") String title,
        String due) {
}