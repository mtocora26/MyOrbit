package com.app.myorbit.notifications.api;

import jakarta.validation.constraints.NotNull;

public record NotificationPreferencesRequest(
        @NotNull(message = "Indica si quieres avisos de fecha limite") Boolean deadline,
        @NotNull(message = "Indica si quieres avisos de tareas completadas") Boolean event,
        @NotNull(message = "Indica si quieres avisos de habitos pendientes") Boolean habit) {
}
