package com.app.myorbit.notifications.domain;

import java.time.LocalDateTime;

/**
 * Datos de entrada de una notificación, independientes del evento que la originó.
 *
 * @param referenceId id de la tarea u hábito de origen
 * @param subject     título de la tarea u hábito
 * @param when        fecha relevante (vencimiento, día del hábito); puede ser null
 * @param quit        solo en avisos de hábitos: true si es un hábito para dejar
 */
public record NotificationRequest(NotificationType type, String userId, String referenceId, String subject, LocalDateTime when, boolean quit) {
    public NotificationRequest(NotificationType type, String userId, String referenceId, String subject, LocalDateTime when) {
        this(type, userId, referenceId, subject, when, false);
    }
}
