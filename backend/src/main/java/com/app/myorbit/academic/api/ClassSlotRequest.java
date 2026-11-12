package com.app.myorbit.academic.api;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Franja semanal: {@code dayOfWeek} 1 (lunes) a 7 (domingo), horas {@code HH:mm} (24 h) y salón opcional. */
public record ClassSlotRequest(
        @NotNull(message = "El dia de la clase es obligatorio") @Min(value = 1, message = "El dia de la clase debe estar entre 1 (lunes) y 7 (domingo)") @Max(value = 7, message = "El dia de la clase debe estar entre 1 (lunes) y 7 (domingo)") Integer dayOfWeek,
        @NotBlank(message = "La hora de inicio es obligatoria") @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "La hora de inicio debe tener el formato HH:mm") String start,
        @NotBlank(message = "La hora de fin es obligatoria") @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "La hora de fin debe tener el formato HH:mm") String end,
        @Size(max = 50, message = "El salon es demasiado largo") String room) {
}
