package com.app.myorbit.notifications.infrastructure;

import com.app.myorbit.notifications.domain.PushChannel;
import com.app.myorbit.notifications.domain.PushMessage;
import com.app.myorbit.notifications.domain.PushResult;
import com.app.myorbit.notifications.domain.PushSender;
import com.app.myorbit.notifications.domain.PushSubscription;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Security;

/**
 * Adaptador de Web Push con claves VAPID. Solo existe si {@code myorbit.push.vapid.public-key} y
 * {@code myorbit.push.vapid.private-key} están definidas; sin ellas el backend funciona igual, sin push web.
 */
@Component
@ConditionalOnExpression("!'${myorbit.push.vapid.public-key:}'.isBlank() and !'${myorbit.push.vapid.private-key:}'.isBlank()")
public class WebPushSender implements PushSender {
    private static final Logger log = LoggerFactory.getLogger(WebPushSender.class);

    private final PushService pushService;

    public WebPushSender(@Value("${myorbit.push.vapid.public-key}") String publicKey,
                         @Value("${myorbit.push.vapid.private-key}") String privateKey,
                         @Value("${myorbit.push.vapid.subject:mailto:admin@myorbit.app}") String subject) throws Exception {
        if (Security.getProvider("BC") == null) {
            Security.addProvider(new org.bouncycastle.jce.provider.BouncyCastleProvider());
        }
        this.pushService = new PushService(publicKey, privateKey, subject);
    }

    @Override
    public PushChannel channel() {
        return PushChannel.WEB;
    }

    @Override
    public PushResult send(PushSubscription subscription, PushMessage message) {
        try {
            Notification notification = new Notification(
                    subscription.getAddress(), subscription.getP256dh(), subscription.getAuth(),
                    toJson(message).getBytes(StandardCharsets.UTF_8));
            int status = pushService.send(notification).getStatusLine().getStatusCode();
            if (status == 404 || status == 410) return PushResult.GONE;
            if (status >= 200 && status < 300) return PushResult.SENT;
            log.warn("Web Push respondió {} para la suscripción {}", status, subscription.getId());
            return PushResult.FAILED;
        } catch (Exception e) {
            log.warn("No se pudo enviar Web Push a la suscripción {}: {}", subscription.getId(), e.toString());
            return PushResult.FAILED;
        }
    }

    static String toJson(PushMessage message) {
        return "{\"title\":" + quote(message.title()) + ",\"body\":" + quote(message.body())
                + ",\"notificationId\":" + quote(message.notificationId()) + "}";
    }

    private static String quote(String value) {
        if (value == null) return "null";
        StringBuilder out = new StringBuilder("\"");
        for (char c : value.toCharArray()) {
            switch (c) {
                case '"' -> out.append("\\\"");
                case '\\' -> out.append("\\\\");
                case '\n' -> out.append("\\n");
                case '\r' -> out.append("\\r");
                case '\t' -> out.append("\\t");
                default -> {
                    if (c < 0x20) out.append(String.format("\\u%04x", (int) c));
                    else out.append(c);
                }
            }
        }
        return out.append('"').toString();
    }
}
