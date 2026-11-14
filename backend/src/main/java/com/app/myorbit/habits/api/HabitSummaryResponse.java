package com.app.myorbit.habits.api;

import com.app.myorbit.habits.application.HabitService.HabitSummary;

/** Estadísticas y meta mensual de un hábito; {@code monthlyGoal} es null si el hábito no tiene meta. */
public record HabitSummaryResponse(String habitId, HabitStatsResponse stats, MonthlyGoalResponse monthlyGoal) {
    public static HabitSummaryResponse from(HabitSummary summary) {
        return new HabitSummaryResponse(
                summary.habitId(),
                HabitStatsResponse.from(summary.stats()),
                summary.monthlyGoal() == null ? null : MonthlyGoalResponse.from(summary.monthlyGoal()));
    }
}
