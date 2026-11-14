package com.app.myorbit.tasks.domain;

import java.time.LocalDateTime;

/**
 * Tarea pendiente cuyo vencimiento está próximo; lo publica el recordatorio programado.
 *
 * @param imminent true para el aviso de «falta una hora»; false para el de «falta un día»
 */
public record TaskDueSoonEvent(String userId, String taskId, String title, LocalDateTime due, boolean imminent) {
}
