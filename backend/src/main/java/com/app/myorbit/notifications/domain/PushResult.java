package com.app.myorbit.notifications.domain;

/** Resultado de entregar un aviso a un dispositivo. */
public enum PushResult {
    SENT,
    /** El dispositivo ya no existe (suscripción caducada o app desinstalada): hay que borrarlo. */
    GONE,
    /** Falla transitoria: se conserva el dispositivo y no se reintenta. */
    FAILED
}
