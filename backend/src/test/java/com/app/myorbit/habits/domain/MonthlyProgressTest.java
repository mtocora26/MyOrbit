package com.app.myorbit.habits.domain;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MonthlyProgressTest {
    private static final YearMonth OCTOBER = YearMonth.of(2026, 10);

    private static Habit daily(String createdDate, String... completed) {
        Habit habit = new Habit();
        habit.setFrequency(HabitFrequency.DAILY);
        habit.setCreatedDate(createdDate);
        habit.setCompletedDates(new java.util.ArrayList<>(List.of(completed)));
        return habit;
    }

    private static String[] octoberDays(int from, int to) {
        return IntStream.rangeClosed(from, to).mapToObj(d -> String.format("2026-10-%02d", d)).toArray(String[]::new);
    }

    @Test
    void theGoalIsAPercentageOfTheScheduledDaysOfTheWholeMonth() {
        Habit habit = daily("2026-10-01", octoberDays(1, 8));

        MonthlyProgress progress = MonthlyProgress.calculate(habit, OCTOBER, 80, LocalDate.of(2026, 10, 10));

        assertEquals(31, progress.scheduledDays());
        assertEquals(8, progress.completedDays());
        assertEquals(25, progress.requiredDays()); // ceil(31 * 0.8)
        assertEquals(17, progress.remainingToGoal());
        assertEquals(22, progress.remainingDays()); // del 10 al 31, ninguno cumplido
        assertEquals(25.8, progress.rate());
        assertFalse(progress.approved());
        assertTrue(progress.reachable());
    }

    @Test
    void reachingTheGoalApprovesTheMonthWithoutNeedingAllDays() {
        Habit habit = daily("2026-10-01", octoberDays(1, 25));

        MonthlyProgress progress = MonthlyProgress.calculate(habit, OCTOBER, 80, LocalDate.of(2026, 10, 25));

        assertTrue(progress.approved());
        assertEquals(0, progress.remainingToGoal());
        assertTrue(progress.reachable());
    }

    @Test
    void aMonthBecomesUnreachableWhenWhatIsMissingDoesNotFitInTheRemainingDays() {
        Habit habit = daily("2026-10-01", octoberDays(1, 5));

        MonthlyProgress progress = MonthlyProgress.calculate(habit, OCTOBER, 80, LocalDate.of(2026, 10, 28));

        assertEquals(20, progress.remainingToGoal());
        assertEquals(4, progress.remainingDays()); // 28, 29, 30, 31
        assertFalse(progress.reachable());
        assertFalse(progress.approved());
    }

    @Test
    void onlyScheduledDaysCountForACustomHabit() {
        // Octubre de 2026: los lunes son 5, 12, 19 y 26.
        Habit habit = daily("2026-10-01", "2026-10-05", "2026-10-12", "2026-10-07");
        habit.setFrequency(HabitFrequency.CUSTOM);
        habit.setDaysOfWeek(List.of(1));

        MonthlyProgress progress = MonthlyProgress.calculate(habit, OCTOBER, 50, LocalDate.of(2026, 10, 13));

        assertEquals(4, progress.scheduledDays());
        assertEquals(2, progress.completedDays()); // el miércoles 7 no está programado: se ignora
        assertEquals(2, progress.requiredDays());
        assertTrue(progress.approved());
    }

    @Test
    void theFirstMonthCountsOnlyFromTheDayTheHabitWasCreated() {
        Habit habit = daily("2026-10-21", octoberDays(21, 31));

        MonthlyProgress progress = MonthlyProgress.calculate(habit, OCTOBER, 100, LocalDate.of(2026, 10, 31));

        assertEquals(11, progress.scheduledDays());
        assertTrue(progress.approved());
    }

    @Test
    void aMonthWithNoScheduledDaysIsNeverApproved() {
        Habit habit = daily("2026-11-20");

        MonthlyProgress progress = MonthlyProgress.calculate(habit, OCTOBER, 80, LocalDate.of(2026, 11, 25));

        assertEquals(0, progress.scheduledDays());
        assertFalse(progress.approved());
    }

    @Test
    void historyListsFinishedMonthsNewestFirstWithoutGoingBeforeCreation() {
        Habit habit = daily("2026-08-15");
        habit.getCompletedDates().addAll(List.of(octoberDays(1, 1)));
        for (int day = 1; day <= 30; day++) habit.getCompletedDates().add(String.format("2026-09-%02d", day));

        List<MonthlyProgress> history = MonthlyProgress.history(habit, 80, LocalDate.of(2026, 10, 10), 6);

        assertEquals(List.of("2026-09", "2026-08"), history.stream().map(MonthlyProgress::month).toList());
        assertTrue(history.get(0).approved());
        assertEquals(17, history.get(1).scheduledDays()); // del 15 al 31 de agosto
        assertFalse(history.get(1).approved());
    }

    @Test
    void historyHonoursTheRequestedNumberOfMonths() {
        Habit habit = daily("2026-01-01");

        assertEquals(2, MonthlyProgress.history(habit, 80, LocalDate.of(2026, 10, 10), 2).size());
        assertEquals(0, MonthlyProgress.history(habit, 80, LocalDate.of(2026, 10, 10), 0).size());
    }
}
