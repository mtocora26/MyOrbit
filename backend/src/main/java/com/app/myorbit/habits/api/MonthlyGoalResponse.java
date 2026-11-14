package com.app.myorbit.habits.api;

import com.app.myorbit.habits.application.HabitService.MonthlyGoalReport;
import com.app.myorbit.habits.domain.MonthlyProgress;

import java.util.List;

/** Meta mensual de un hábito: avance del mes en curso y meses anteriores (más reciente primero). */
public record MonthlyGoalResponse(int goal, MonthlyProgress current, List<MonthlyProgress> history) {
    public static MonthlyGoalResponse from(MonthlyGoalReport report) {
        return new MonthlyGoalResponse(report.goal(), report.current(), List.copyOf(report.history()));
    }
}
