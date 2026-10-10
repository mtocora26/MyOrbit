package com.app.myorbit.habits.api;

import com.app.myorbit.habits.domain.Habit;
import com.app.myorbit.habits.domain.HabitFrequency;

import java.util.List;

public record HabitResponse(String id, String userId, String title, HabitFrequency frequency, List<Integer> daysOfWeek,
                            String color, String icon, List<String> completedDates) {
    public static HabitResponse from(Habit habit) {
        return new HabitResponse(habit.getId(), habit.getUserId(), habit.getTitle(), habit.getFrequency(),
                List.copyOf(habit.getDaysOfWeek()), habit.getColor(), habit.getIcon(),
                List.copyOf(habit.getCompletedDates()));
    }
}
