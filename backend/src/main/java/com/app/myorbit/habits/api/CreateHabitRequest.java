package com.app.myorbit.habits.api;

import com.app.myorbit.habits.domain.HabitFrequency;

import java.util.List;

public record CreateHabitRequest(String title, HabitFrequency frequency, List<Integer> daysOfWeek, String color, String icon) {
}