package com.app.myorbit.academic.api;

import com.app.myorbit.academic.domain.Semester;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

public record SemesterRequest(
        @NotBlank(message = "El semestre es obligatorio") @Pattern(regexp = Semester.NAME_PATTERN, message = "El semestre debe tener el formato AAAA-1 o AAAA-2") String name,
        LocalDate startDate,
        LocalDate endDate) {
}
