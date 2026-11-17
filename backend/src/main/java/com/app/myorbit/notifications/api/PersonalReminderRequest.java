package com.app.myorbit.notifications.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/** {@code remindAt} es la fecha y hora local del usuario (ISO sin zona, p. ej. {@code 2026-11-20T08:30:00}). */
public record PersonalReminderRequest(
        @NotBlank(message = "Escribe qué quieres recordar") @Size(max = 140, message = "El recordatorio admite hasta 140 caracteres") String text,
        @NotNull(message = "Elige la fecha y la hora") LocalDateTime remindAt) {
}
