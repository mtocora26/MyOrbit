package com.app.myorbit.academic.api;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Componente de un corte; {@code percentage} es sobre el corte (los componentes de un corte suman 100). */
public record EvaluationComponentRequest(
        @NotBlank(message = "El nombre del componente es obligatorio") @Size(max = 100, message = "El nombre del componente es demasiado largo") String name,
        @NotNull(message = "El porcentaje del componente es obligatorio") @DecimalMin(value = "0", inclusive = false, message = "El porcentaje del componente debe ser mayor que 0 y maximo 100") @DecimalMax(value = "100", message = "El porcentaje del componente debe ser mayor que 0 y maximo 100") Double percentage,
        @DecimalMin(value = "0", message = "La nota del componente debe estar entre 0 y 5") @DecimalMax(value = "5", message = "La nota del componente debe estar entre 0 y 5") Double grade) {
}
