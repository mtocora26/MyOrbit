package com.app.myorbit.tasks.domain;

/** Resumen: el usuario tiene {@code count} tareas pendientes cuyo vencimiento ya pasó; lo publica el recordatorio programado. */
public record TaskOverdueEvent(String userId, int count) {
}
