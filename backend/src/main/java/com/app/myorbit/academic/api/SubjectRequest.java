package com.app.myorbit.academic.api;

import com.app.myorbit.academic.domain.Subject;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SubjectRequest(
        @NotBlank(message = "El nombre de la materia es obligatorio") @Size(max = 100, message = "El nombre es demasiado largo") String name,
        @NotNull(message = "Los creditos son obligatorios") @Min(value = Subject.MIN_CREDITS, message = "Los creditos deben estar entre 1 y 20") @Max(value = Subject.MAX_CREDITS, message = "Los creditos deben estar entre 1 y 20") Integer credits,
        @NotBlank(message = "El semestre es obligatorio") @Pattern(regexp = "^\\d{4}-[12]$", message = "El semestre debe tener el formato AAAA-1 o AAAA-2") String semester,
        @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "El color debe ser hexadecimal, por ejemplo #7A5AF8") String color) {
}
