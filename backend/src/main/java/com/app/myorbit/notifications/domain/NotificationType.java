package com.app.myorbit.notifications.domain;

public enum NotificationType {
    /** Tarea con fecha límite (al crearla, un día antes y una hora antes). */
    DEADLINE,
    /** Hábito pendiente de cumplir. */
    HABIT,
    /** Resumen de tareas pendientes ya vencidas. */
    OVERDUE,
    /** Parcial o evaluación próxima, con su fecha. */
    EXAM,
    /** Materia del semestre en curso en riesgo de no aprobarse. */
    AT_RISK,
    /** Clase que empieza en media hora o evento con hora que empieza ahora. */
    CLASS,
    /** Recordatorio personal que el usuario programó con texto, fecha y hora. */
    REMINDER
}
