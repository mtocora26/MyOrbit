package com.app.myorbit.habits.api;

import com.app.myorbit.habits.domain.HabitFrequency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

/** Edición de un hábito: el título es obligatorio; frecuencia, color e icono ausentes conservan el valor actual. */
public record UpdateHabitRequest(
        @NotBlank(message = "El nombre del habito es obligatorio") @Size(max = 100, message = "El nombre es demasiado largo") String title,
        HabitFrequency frequency,
        List<Integer> daysOfWeek,
        @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "El color debe ser hexadecimal, por ejemplo #7A5AF8") String color,
        @Size(max = 50, message = "El icono es demasiado largo") String icon) {
}
