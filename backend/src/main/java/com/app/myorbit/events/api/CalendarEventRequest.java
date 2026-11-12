package com.app.myorbit.events.api;

import com.app.myorbit.events.domain.CalendarEvent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Un evento de uno o varios días. {@code endDate} ausente = un solo día. {@code startTime}/{@code endTime} son horas
 * {@code HH:mm} opcionales (la de fin exige la de inicio). {@code subjectId} y {@code categoryId} asocian el evento a una
 * materia o una categoría del usuario. El {@code PUT} reemplaza todo: omitir un campo opcional lo quita.
 */
public record CalendarEventRequest(
        @NotBlank(message = "El titulo del evento es obligatorio") @Size(max = CalendarEvent.MAX_TITLE_LENGTH, message = "El titulo es demasiado largo") String title,
        @NotNull(message = "La fecha de inicio es obligatoria") LocalDate startDate,
        LocalDate endDate,
        @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "La hora de inicio debe tener el formato HH:mm") String startTime,
        @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "La hora de fin debe tener el formato HH:mm") String endTime,
        String subjectId,
        String categoryId) {
}
