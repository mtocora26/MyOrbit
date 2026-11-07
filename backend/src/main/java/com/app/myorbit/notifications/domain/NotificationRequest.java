package com.app.myorbit.notifications.domain;

import java.time.LocalDateTime;

/**
 * Datos de entrada de una notificación, independientes del evento que la originó.
 *
 * @param referenceId id de la tarea u hábito de origen
 * @param subject     título de la tarea u hábito
 * @param when        fecha relevante (vencimiento, día del hábito); puede ser null
 */
public record NotificationRequest(NotificationType type, String userId, String referenceId, String subject, LocalDateTime when) {
}
