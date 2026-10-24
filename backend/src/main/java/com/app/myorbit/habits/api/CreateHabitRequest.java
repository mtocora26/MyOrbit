package com.app.myorbit.habits.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.app.myorbit.habits.domain.HabitFrequency;

import java.util.List;

public record CreateHabitRequest(@NotBlank(message = "El nombre del habito es obligatorio") @Size(max = 100, message = "El nombre es demasiado largo") String title, HabitFrequency frequency, List<Integer> daysOfWeek, String color, String icon) {
}