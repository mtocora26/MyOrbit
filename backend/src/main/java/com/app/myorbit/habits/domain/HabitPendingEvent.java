package com.app.myorbit.habits.domain;

import java.time.LocalDate;

/**
 * Hábito programado para {@code date} que aún no se ha marcado como cumplido ese día.
 *
 * @param quit true si es un hábito para dejar: el aviso pregunta si hoy lo evitó
 */
public record HabitPendingEvent(String userId, String habitId, String title, LocalDate date, boolean quit) {
    public HabitPendingEvent(String userId, String habitId, String title, LocalDate date) {
        this(userId, habitId, title, date, false);
    }
}
