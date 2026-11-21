package com.app.myorbit.notifications.api;

import com.app.myorbit.notifications.domain.PushChannel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Dispositivo a registrar. En {@code WEB}, {@code address} es el endpoint de la suscripción y
 * {@code p256dh} y {@code auth} son sus claves; en {@code FCM}, {@code address} es el token del dispositivo.
 */
public record PushSubscriptionRequest(
        @NotNull(message = "Indica el canal (WEB o FCM)") PushChannel channel,
        @NotBlank(message = "Falta la dirección del dispositivo") String address,
        String p256dh,
        String auth) {
}
