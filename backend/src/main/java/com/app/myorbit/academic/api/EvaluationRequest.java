package com.app.myorbit.academic.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Una evaluación es un corte. Con {@code components} su nota sale del promedio ponderado de ellos y no se envía
 * {@code grade}; sin ellos (null o vacío) {@code grade} es la nota directa del corte.
 */
public record EvaluationRequest(
        @NotBlank(message = "El nombre de la evaluacion es obligatorio") @Size(max = 100, message = "El nombre es demasiado largo") String name,
        @NotNull(message = "El porcentaje es obligatorio") @DecimalMin(value = "0", inclusive = false, message = "El porcentaje debe ser mayor que 0 y maximo 100") @DecimalMax(value = "100", message = "El porcentaje debe ser mayor que 0 y maximo 100") Double percentage,
        @DecimalMin(value = "0", message = "La nota debe estar entre 0 y 5") @DecimalMax(value = "5", message = "La nota debe estar entre 0 y 5") Double grade,
        String due,
        @Size(max = 20, message = "Un corte admite como maximo 20 componentes") List<@Valid @NotNull(message = "El componente no puede ser nulo") EvaluationComponentRequest> components) {

    /** Sin fecha ni componentes. */
    public EvaluationRequest(String name, Double percentage, Double grade) {
        this(name, percentage, grade, null, null);
    }

    /** Sin componentes. */
    public EvaluationRequest(String name, Double percentage, Double grade, String due) {
        this(name, percentage, grade, due, null);
    }
}
