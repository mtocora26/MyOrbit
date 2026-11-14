package com.app.myorbit.habits.domain;

/**
 * Qué busca el hábito. En {@link #BUILD} marcar el día significa «lo hice»; en {@link #QUIT} (dejar fumar, menos
 * redes) significa «hoy lo evité». El motor de cumplimiento, rachas y metas mensuales es el mismo para ambos.
 */
public enum HabitType {
    BUILD,
    QUIT
}
