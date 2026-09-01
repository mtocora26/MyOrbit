package com.app.MyOrbit.habits;

import java.util.List;

public record CreateHabitRequest(String title, String frequency, List<Integer> daysOfWeek, String color, String icon) {
}