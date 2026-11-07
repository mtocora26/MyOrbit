package com.app.myorbit.habits.domain;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class HabitStatsTest {
    // 2026-11-07 es sábado.
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 7);

    private Habit daily(String... done) {
        Habit habit = new Habit();
        habit.setFrequency(HabitFrequency.DAILY);
        habit.setDaysOfWeek(List.of(1, 2, 3, 4, 5, 6, 7));
        habit.setCompletedDates(new ArrayList<>(List.of(done)));
        return habit;
    }

    private Habit custom(List<Integer> days, String... done) {
        Habit habit = daily(done);
        habit.setFrequency(HabitFrequency.CUSTOM);
        habit.setDaysOfWeek(days);
        return habit;
    }

    @Test
    void habitWithoutHistoryHasNoStreaksAndZeroRate() {
        HabitStats stats = HabitStats.calculate(daily(), TODAY, 30);

        assertEquals(0, stats.currentStreak());
        assertEquals(0, stats.bestStreak());
        assertEquals(0.0, stats.completionRate());
        assertEquals(29, stats.scheduledDays()); // hoy sin cumplir no cuenta
        assertEquals(30, stats.windowDays());
    }

    @Test
    void currentStreakCountsConsecutiveDaysEndingToday() {
        HabitStats stats = HabitStats.calculate(daily("2026-11-05", "2026-11-06", "2026-11-07"), TODAY, 7);

        assertEquals(3, stats.currentStreak());
        assertEquals(3, stats.bestStreak());
    }

    @Test
    void pendingTodayDoesNotBreakTheStreak() {
        HabitStats stats = HabitStats.calculate(daily("2026-11-04", "2026-11-05", "2026-11-06"), TODAY, 7);

        assertEquals(3, stats.currentStreak());
    }

    @Test
    void aMissedDayBreaksTheCurrentStreakButNotTheBest() {
        HabitStats stats = HabitStats.calculate(
                daily("2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-11-06", "2026-11-07"), TODAY, 30);

        assertEquals(2, stats.currentStreak());
        assertEquals(4, stats.bestStreak());
    }

    @Test
    void streakIsZeroWhenYesterdayWasMissed() {
        HabitStats stats = HabitStats.calculate(daily("2026-11-04", "2026-11-05"), TODAY, 30);

        assertEquals(0, stats.currentStreak());
        assertEquals(2, stats.bestStreak());
    }

    @Test
    void unscheduledDaysNeitherBreakNorExtendTheStreak() {
        // lunes (1) y viernes (5): 2026-11-02 lun, 11-06 vie. Sábado 7 no está programado.
        Habit habit = custom(List.of(1, 5), "2026-10-30", "2026-11-02", "2026-11-06");

        HabitStats stats = HabitStats.calculate(habit, TODAY, 14);

        assertEquals(3, stats.currentStreak());
        assertEquals(3, stats.bestStreak());
    }

    @Test
    void completionsOnUnscheduledDaysAreIgnored() {
        Habit habit = custom(List.of(1), "2026-11-03", "2026-11-04"); // martes y miércoles no cuentan

        HabitStats stats = HabitStats.calculate(habit, TODAY, 7);

        assertEquals(0, stats.currentStreak());
        assertEquals(0, stats.bestStreak());
        assertEquals(0, stats.completedDays());
        assertEquals(1, stats.scheduledDays()); // solo el lunes 2026-11-02 de la ventana
    }

    @Test
    void completionRateIsComputedOverScheduledDaysOfTheWindow() {
        // Ventana de 4 días: 4, 5, 6, 7 (hoy cumplido). Se cumplen 5 y 7.
        HabitStats stats = HabitStats.calculate(daily("2026-11-05", "2026-11-07"), TODAY, 4);

        assertEquals(4, stats.scheduledDays());
        assertEquals(2, stats.completedDays());
        assertEquals(50.0, stats.completionRate());
    }

    @Test
    void rateIsRoundedToOneDecimal() {
        HabitStats stats = HabitStats.calculate(daily("2026-11-05"), TODAY, 4); // 4,5,6 programados (hoy pendiente no cuenta) -> 1/3

        assertEquals(3, stats.scheduledDays());
        assertEquals(33.3, stats.completionRate());
    }

    @Test
    void newHabitIsNotPenalizedForDaysBeforeItsCreation() {
        Habit habit = daily("2026-11-06", "2026-11-07");
        habit.setCreatedDate("2026-11-06");

        HabitStats stats = HabitStats.calculate(habit, TODAY, 30);

        assertEquals(2, stats.scheduledDays());
        assertEquals(100.0, stats.completionRate());
    }

    @Test
    void completionsBeforeCreationDateStillExtendTheWindow() {
        Habit habit = daily("2026-11-01");
        habit.setCreatedDate("2026-11-06");

        HabitStats stats = HabitStats.calculate(habit, TODAY, 30);

        assertEquals(6, stats.scheduledDays()); // del 1 al 6 (hoy pendiente no cuenta)
        assertEquals(1, stats.completedDays());
    }

    @Test
    void invalidStoredDatesAreIgnored() {
        HabitStats stats = HabitStats.calculate(daily("basura", "2026-11-07", "10/11/2026"), TODAY, 7);

        assertEquals(1, stats.currentStreak());
        assertEquals(1, stats.completedDays());
    }

    @Test
    void streakLongerThanTheWindowIsStillCounted() {
        List<String> dates = new ArrayList<>();
        for (int i = 0; i < 20; i++) dates.add(TODAY.minusDays(i).toString());

        HabitStats stats = HabitStats.calculate(daily(dates.toArray(String[]::new)), TODAY, 7);

        assertEquals(20, stats.currentStreak());
        assertEquals(20, stats.bestStreak());
        assertEquals(100.0, stats.completionRate());
    }
}
