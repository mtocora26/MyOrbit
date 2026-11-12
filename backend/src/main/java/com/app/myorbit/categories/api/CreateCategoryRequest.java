package com.app.myorbit.categories.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** {@code parentId}: opcional; si viene, la categoría es una subcategoría de esa (que debe ser una categoría raíz). */
public record CreateCategoryRequest(
        @NotBlank(message = "El nombre de la categoria es obligatorio") @Size(max = 50, message = "El nombre es demasiado largo") String name,
        String color,
        String parentId) {

    /** Categoría raíz. */
    public CreateCategoryRequest(String name, String color) {
        this(name, color, null);
    }
}
