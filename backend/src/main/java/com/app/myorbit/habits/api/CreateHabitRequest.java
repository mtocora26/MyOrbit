package com.app.myorbit.habits.api;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.app.myorbit.habits.domain.HabitFrequency;
import com.app.myorbit.habits.domain.HabitType;

import java.util.List;

public record CreateHabitRequest(@NotBlank(message = "El nombre del habito es obligatorio") @Size(max = 100, message = "El nombre es demasiado largo") String title, HabitFrequency frequency, List<Integer> daysOfWeek, String color, String icon,
                                 @Min(value = 1, message = "La meta mensual debe estar entre 1 y 100") @Max(value = 100, message = "La meta mensual debe estar entre 1 y 100") Integer monthlyGoal, HabitType type) {
    public CreateHabitRequest(String title, HabitFrequency frequency, List<Integer> daysOfWeek, String color, String icon) {
        this(title, frequency, daysOfWeek, color, icon, null, null);
    }

    public CreateHabitRequest(String title, HabitFrequency frequency, List<Integer> daysOfWeek, String color, String icon, Integer monthlyGoal) {
        this(title, frequency, daysOfWeek, color, icon, monthlyGoal, null);
    }
}