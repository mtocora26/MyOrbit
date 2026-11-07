package com.app.myorbit.habits.api;

import com.app.myorbit.habits.domain.HabitStats;

public record HabitStatsResponse(int currentStreak, int bestStreak, double completionRate, int scheduledDays,
                                 int completedDays, int windowDays) {
    public static HabitStatsResponse from(HabitStats stats) {
        return new HabitStatsResponse(stats.currentStreak(), stats.bestStreak(), stats.completionRate(),
                stats.scheduledDays(), stats.completedDays(), stats.windowDays());
    }
}
