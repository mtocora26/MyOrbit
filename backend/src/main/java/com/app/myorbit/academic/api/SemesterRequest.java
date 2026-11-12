package com.app.myorbit.academic.api;

import com.app.myorbit.academic.domain.Semester;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

/** {@code targetAverage}: meta de promedio del semestre, opcional (el PUT reemplaza: omitirla la quita). */
public record SemesterRequest(
        @NotBlank(message = "El semestre es obligatorio") @Pattern(regexp = Semester.NAME_PATTERN, message = "El semestre debe tener el formato AAAA-1 o AAAA-2") String name,
        LocalDate startDate,
        LocalDate endDate,
        @DecimalMin(value = "0", message = "La meta del semestre debe estar entre 0 y 5") @DecimalMax(value = "5", message = "La meta del semestre debe estar entre 0 y 5") Double targetAverage) {

    /** Sin meta de promedio. */
    public SemesterRequest(String name, LocalDate startDate, LocalDate endDate) {
        this(name, startDate, endDate, null);
    }
}
