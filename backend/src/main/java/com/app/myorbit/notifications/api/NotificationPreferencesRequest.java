package com.app.myorbit.notifications.api;

import jakarta.validation.constraints.NotNull;

public record NotificationPreferencesRequest(
        @NotNull(message = "Indica si quieres avisos de fecha limite") Boolean deadline,
        @NotNull(message = "Indica si quieres avisos de habitos pendientes") Boolean habit,
        @NotNull(message = "Indica si quieres avisos de tareas vencidas") Boolean overdue,
        @NotNull(message = "Indica si quieres avisos de parciales proximos") Boolean exam,
        @NotNull(message = "Indica si quieres avisos de materias en riesgo") Boolean atRisk) {
}
