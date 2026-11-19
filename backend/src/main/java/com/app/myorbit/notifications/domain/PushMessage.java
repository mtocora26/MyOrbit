package com.app.myorbit.notifications.domain;

/** Contenido de un aviso push, independiente del canal. */
public record PushMessage(String title, String body, String notificationId) {
}
