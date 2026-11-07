package com.app.myorbit.habits.domain;

import java.time.LocalDate;

/** Hábito programado para {@code date} que aún no se ha marcado como cumplido ese día. */
public record HabitPendingEvent(String userId, String habitId, String title, LocalDate date) {
}
