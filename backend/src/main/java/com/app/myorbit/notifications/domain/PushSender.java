package com.app.myorbit.notifications.domain;

/** Puerto de salida: entrega un aviso a un dispositivo por un canal concreto. */
public interface PushSender {
    PushChannel channel();

    PushResult send(PushSubscription subscription, PushMessage message);
}
