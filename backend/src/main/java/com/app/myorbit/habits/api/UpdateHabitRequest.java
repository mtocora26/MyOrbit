package com.app.myorbit.habits.api;

import com.app.myorbit.habits.domain.HabitFrequency;
import com.app.myorbit.habits.domain.HabitType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Edición de un hábito: el título es obligatorio; frecuencia, color, icono, meta mensual y tipo ausentes conservan el valor
 * actual. {@code monthlyGoal} 0 quita la meta; 1-100 la fija.
 */
public record UpdateHabitRequest(
        @NotBlank(message = "El nombre del habito es obligatorio") @Size(max = 100, message = "El nombre es demasiado largo") String title,
        HabitFrequency frequency,
        List<Integer> daysOfWeek,
        @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "El color debe ser hexadecimal, por ejemplo #7A5AF8") String color,
        @Size(max = 50, message = "El icono es demasiado largo") String icon,
        @Min(value = 0, message = "La meta mensual debe estar entre 1 y 100 (0 la quita)") @Max(value = 100, message = "La meta mensual debe estar entre 1 y 100 (0 la quita)") Integer monthlyGoal,
        HabitType type) {
    public UpdateHabitRequest(String title, HabitFrequency frequency, List<Integer> daysOfWeek, String color, String icon) {
        this(title, frequency, daysOfWeek, color, icon, null, null);
    }

    public UpdateHabitRequest(String title, HabitFrequency frequency, List<Integer> daysOfWeek, String color, String icon, Integer monthlyGoal) {
        this(title, frequency, daysOfWeek, color, icon, monthlyGoal, null);
    }
}
