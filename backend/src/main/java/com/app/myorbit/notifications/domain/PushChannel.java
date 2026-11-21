package com.app.myorbit.notifications.domain;

/** Canal por el que se entrega un aviso a un dispositivo. */
public enum PushChannel {
    /** Web Push (VAPID) para la PWA instalada o abierta en el navegador. */
    WEB,
    /** Firebase Cloud Messaging para la app Android de Capacitor. */
    FCM
}
