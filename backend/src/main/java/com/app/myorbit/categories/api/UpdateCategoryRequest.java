package com.app.myorbit.categories.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateCategoryRequest(
        @NotBlank(message = "El nombre de la categoria es obligatorio") @Size(max = 50, message = "El nombre es demasiado largo") String name,
        @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "El color debe ser hexadecimal, por ejemplo #7A5AF8") String color) {
}
