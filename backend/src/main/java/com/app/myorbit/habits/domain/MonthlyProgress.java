package com.app.myorbit.habits.domain;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Cumplimiento mensual de un hábito frente a su meta (#143). Un mes se aprueba si los días cumplidos llegan al
 * {@code goal} % de los días programados del mes completo; no se exige el 100 %.
 *
 * <p>El primer mes del hábito cuenta solo desde su día de creación (o su primer cumplimiento, si es anterior), para no
 * penalizar los días en que aún no existía. El historial usa la meta actual del hábito.
 *
 * @param month          mes en formato AAAA-MM
 * @param scheduledDays  días programados del mes (los que cuentan para la meta)
 * @param completedDays  de esos, los cumplidos
 * @param requiredDays   mínimo de días cumplidos para aprobar el mes: ⌈goal % de los programados⌉
 * @param remainingToGoal cuántos cumplimientos más faltan para aprobar (0 si ya se llegó)
 * @param remainingDays  días programados que aún quedan por cumplir (hoy incluido si falta); 0 en meses pasados
 * @param rate           % cumplido de los programados (0-100, un decimal)
 * @param approved       los cumplidos alcanzan el mínimo
 * @param reachable      aún se puede aprobar: lo que falta cabe en los días que quedan (siempre true si ya se aprobó)
 */
public record MonthlyProgress(String month, int scheduledDays, int completedDays, int requiredDays, int remainingToGoal,
                              int remainingDays, double rate, boolean approved, boolean reachable) {

    /** Mes de {@code month} evaluado con la meta {@code goal} (1-100) a la fecha {@code today}. */
    public static MonthlyProgress calculate(Habit habit, YearMonth month, int goal, LocalDate today) {
        Set<LocalDate> done = parseDates(habit);
        LocalDate first = firstDay(habit, done, month);
        int scheduled = 0;
        int completed = 0;
        int remainingDays = 0;
        for (LocalDate day = first; !day.isAfter(month.atEndOfMonth()); day = day.plusDays(1)) {
            if (!habit.isScheduledOn(day)) continue;
            scheduled++;
            if (done.contains(day)) completed++;
            else if (!day.isBefore(today)) remainingDays++;
        }
        int required = (int) Math.ceil(scheduled * goal / 100.0);
        int remainingToGoal = Math.max(0, required - completed);
        double rate = scheduled == 0 ? 0 : Math.round(completed * 1000.0 / scheduled) / 10.0;
        boolean approved = scheduled > 0 && completed >= required;
        return new MonthlyProgress(month.toString(), scheduled, completed, required, remainingToGoal, remainingDays, rate,
                approved, approved || remainingToGoal <= remainingDays);
    }

    /**
     * Meses ya terminados, del más reciente al más antiguo, hasta {@code months} y sin pasar del mes de creación del
     * hábito. Los meses sin días programados se omiten.
     */
    public static List<MonthlyProgress> history(Habit habit, int goal, LocalDate today, int months) {
        Set<LocalDate> done = parseDates(habit);
        LocalDate start = habitStart(habit, done);
        YearMonth oldest = start == null ? YearMonth.from(today).minusMonths(months) : YearMonth.from(start);
        List<MonthlyProgress> history = new ArrayList<>();
        YearMonth month = YearMonth.from(today).minusMonths(1);
        for (int i = 0; i < months && !month.isBefore(oldest); i++, month = month.minusMonths(1)) {
            MonthlyProgress progress = calculate(habit, month, goal, today);
            if (progress.scheduledDays() > 0) history.add(progress);
        }
        return history;
    }

    /** Primer día que cuenta del hábito: el de creación o el primer cumplimiento (el menor); null si no se conoce. */
    private static LocalDate habitStart(Habit habit, Set<LocalDate> done) {
        LocalDate created = parse(habit.getCreatedDate());
        if (created == null) return null;
        LocalDate earliest = done.stream().min(LocalDate::compareTo).orElse(null);
        return earliest != null && earliest.isBefore(created) ? earliest : created;
    }

    private static LocalDate firstDay(Habit habit, Set<LocalDate> done, YearMonth month) {
        LocalDate start = habitStart(habit, done);
        return start != null && start.isAfter(month.atDay(1)) ? start : month.atDay(1);
    }

    private static Set<LocalDate> parseDates(Habit habit) {
        Set<LocalDate> dates = new HashSet<>();
        for (String raw : habit.getCompletedDates()) {
            LocalDate date = parse(raw);
            if (date != null) dates.add(date);
        }
        return dates;
    }

    private static LocalDate parse(String raw) {
        if (raw == null) return null;
        try {
            return LocalDate.parse(raw);
        } catch (DateTimeParseException e) {
            return null;
        }
    }
}
