package com.app.myorbit.categories.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCategoryRequest(
        @NotBlank(message = "El nombre de la categoria es obligatorio") @Size(max = 50, message = "El nombre es demasiado largo") String name,
        String color) {
}
