package com.app.myorbit.habits.domain;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.HashSet;
import java.util.Set;

/**
 * Estadísticas de un hábito, calculadas solo sobre sus días programados: un día no programado de un hábito
 * personalizado ni rompe ni suma a la racha, y un cumplimiento en un día no programado se ignora.
 *
 * @param currentStreak  días programados consecutivos cumplidos hasta hoy (hoy sin marcar aún no rompe la racha)
 * @param bestStreak     la racha más larga de todo el historial
 * @param completionRate % de días programados cumplidos en la ventana (0-100, un decimal)
 * @param scheduledDays  días programados de la ventana (hoy cuenta solo si ya está cumplido)
 * @param completedDays  de esos, los cumplidos
 * @param windowDays     tamaño de la ventana pedida; se recorta al día de creación del hábito
 */
public record HabitStats(int currentStreak, int bestStreak, double completionRate, int scheduledDays, int completedDays, int windowDays) {

    public static HabitStats calculate(Habit habit, LocalDate today, int windowDays) {
        Set<LocalDate> done = parseDates(habit);
        LocalDate earliest = done.stream().min(LocalDate::compareTo).orElse(null);

        int[] rate = completionInWindow(habit, done, earliest, today, windowDays);
        double percentage = rate[0] == 0 ? 0 : Math.round(rate[1] * 1000.0 / rate[0]) / 10.0;
        return new HabitStats(currentStreak(habit, done, earliest, today), bestStreak(habit, done, earliest, today),
                percentage, rate[0], rate[1], windowDays);
    }

    private static int currentStreak(Habit habit, Set<LocalDate> done, LocalDate earliest, LocalDate today) {
        if (earliest == null) return 0;
        LocalDate day = today;
        if (habit.isScheduledOn(today) && !done.contains(today)) day = today.minusDays(1);
        int streak = 0;
        for (; !day.isBefore(earliest); day = day.minusDays(1)) {
            if (!habit.isScheduledOn(day)) continue;
            if (!done.contains(day)) break;
            streak++;
        }
        return streak;
    }

    private static int bestStreak(Habit habit, Set<LocalDate> done, LocalDate earliest, LocalDate today) {
        if (earliest == null) return 0;
        int best = 0;
        int run = 0;
        for (LocalDate day = earliest; !day.isAfter(today); day = day.plusDays(1)) {
            if (!habit.isScheduledOn(day)) continue;
            run = done.contains(day) ? run + 1 : 0;
            best = Math.max(best, run);
        }
        return best;
    }

    /** @return {programados, cumplidos} en la ventana */
    private static int[] completionInWindow(Habit habit, Set<LocalDate> done, LocalDate earliest, LocalDate today, int windowDays) {
        LocalDate start = today.minusDays(windowDays - 1L);
        LocalDate created = parse(habit.getCreatedDate());
        if (created != null) {
            // Un hábito nuevo no se penaliza por días anteriores a su creación (salvo que ya tenga cumplimientos previos).
            LocalDate firstDay = earliest != null && earliest.isBefore(created) ? earliest : created;
            if (firstDay.isAfter(start)) start = firstDay;
        }
        int scheduled = 0;
        int completed = 0;
        for (LocalDate day = start; !day.isAfter(today); day = day.plusDays(1)) {
            if (!habit.isScheduledOn(day)) continue;
            boolean isDone = done.contains(day);
            if (day.equals(today) && !isDone) continue;
            scheduled++;
            if (isDone) completed++;
        }
        return new int[]{scheduled, completed};
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
