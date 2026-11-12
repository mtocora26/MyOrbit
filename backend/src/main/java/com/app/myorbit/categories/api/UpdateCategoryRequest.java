package com.app.myorbit.categories.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * {@code parentId}: ausente/null no cambia el padre, cadena vacía la convierte en categoría raíz y un id la mueve bajo
 * esa categoría (mismo criterio que {@code categoryId} en las tareas).
 */
public record UpdateCategoryRequest(
        @NotBlank(message = "El nombre de la categoria es obligatorio") @Size(max = 50, message = "El nombre es demasiado largo") String name,
        @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "El color debe ser hexadecimal, por ejemplo #7A5AF8") String color,
        String parentId) {

    /** Sin cambiar el padre. */
    public UpdateCategoryRequest(String name, String color) {
        this(name, color, null);
    }
}
