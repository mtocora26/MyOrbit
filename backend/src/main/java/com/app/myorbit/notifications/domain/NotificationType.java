package com.app.myorbit.notifications.domain;

public enum NotificationType {
    /** Tarea con fecha límite. */
    DEADLINE,
    /** Algo que ocurrió en la app (p. ej. una tarea completada). */
    EVENT,
    /** Hábito pendiente de cumplir. */
    HABIT
}
