package com.app.myorbit.notifications.api;

/**
 * Lo que el cliente necesita para suscribirse.
 *
 * @param webPublicKey clave pública VAPID, o null si el servidor no tiene Web Push configurado
 * @param webAvailable true si el servidor puede enviar por Web Push
 * @param fcmAvailable true si el servidor puede enviar por FCM
 */
public record PushConfigResponse(String webPublicKey, boolean webAvailable, boolean fcmAvailable) {
}
