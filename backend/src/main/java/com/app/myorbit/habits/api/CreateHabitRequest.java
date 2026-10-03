package com.app.myorbit.habits.api;

import java.util.List;

public record CreateHabitRequest(String title, String frequency, List<Integer> daysOfWeek, String color, String icon) {
}