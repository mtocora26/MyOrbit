package com.app.myorbit.notifications.application;

import com.app.myorbit.notifications.domain.Notification;
import com.app.myorbit.notifications.domain.PushChannel;
import com.app.myorbit.notifications.domain.PushMessage;
import com.app.myorbit.notifications.domain.PushResult;
import com.app.myorbit.notifications.domain.PushSender;
import com.app.myorbit.notifications.domain.PushSubscription;
import com.app.myorbit.notifications.infrastructure.PushSubscriptionRepository;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.users.domain.UserDeletedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Dispositivos del usuario y entrega de avisos por push. La entrega nunca hace fallar a quien notifica:
 * corre en segundo plano y los errores solo se registran.
 */
@Service
public class PushService {
    private static final Logger log = LoggerFactory.getLogger(PushService.class);

    private final PushSubscriptionRepository repository;
    private final Map<PushChannel, PushSender> senders = new EnumMap<>(PushChannel.class);
    private final Clock clock;
    private final String webPublicKey;
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    public PushService(PushSubscriptionRepository repository, List<PushSender> senders, Clock clock,
                       @Value("${myorbit.push.vapid.public-key:}") String webPublicKey) {
        this.repository = repository;
        this.clock = clock;
        this.webPublicKey = webPublicKey;
        senders.forEach(sender -> this.senders.put(sender.channel(), sender));
    }

    /** Clave pública VAPID que el navegador necesita para suscribirse, o {@code null} si el push web no está configurado. */
    public String webPublicKey() {
        return webPublicKey == null || webPublicKey.isBlank() ? null : webPublicKey;
    }

    public boolean isAvailable(PushChannel channel) {
        return senders.containsKey(channel);
    }

    public List<PushSubscription> listByUser(String userId) {
        return repository.findByUserId(userId);
    }

    /** Idempotente: registrar de nuevo el mismo dispositivo lo actualiza; si era de otra cuenta, pasa a esta. */
    public PushSubscription register(String userId, PushChannel channel, String address, String p256dh, String auth) {
        if (channel == PushChannel.WEB && (isBlank(p256dh) || isBlank(auth))) {
            throw new BusinessRuleException("Web Push necesita las claves p256dh y auth de la suscripción");
        }
        PushSubscription subscription = repository.findByAddress(address).orElseGet(PushSubscription::new);
        if (subscription.getId() == null) subscription.setCreatedAt(Instant.now(clock));
        subscription.setUserId(userId);
        subscription.setChannel(channel);
        subscription.setAddress(address);
        subscription.setP256dh(p256dh);
        subscription.setAuth(auth);
        return repository.save(subscription);
    }

    /** Idempotente: borrar un dispositivo que no existe no falla. */
    public void unregister(String userId, String address) {
        repository.deleteByUserIdAndAddress(userId, address);
    }

    /** Envía la notificación a todos los dispositivos del usuario, en segundo plano. */
    public void deliver(Notification notification) {
        if (senders.isEmpty()) return;
        PushMessage message = new PushMessage(notification.getTitle(), notification.getMessage(), notification.getId());
        String userId = notification.getUserId();
        executor.execute(() -> {
            try {
                deliverNow(userId, message);
            } catch (RuntimeException e) {
                log.warn("No se pudo entregar el aviso push al usuario {}: {}", userId, e.toString());
            }
        });
    }

    void deliverNow(String userId, PushMessage message) {
        for (PushSubscription subscription : repository.findByUserId(userId)) {
            PushSender sender = senders.get(subscription.getChannel());
            if (sender == null) continue;
            if (sender.send(subscription, message) == PushResult.GONE) {
                repository.delete(subscription);
            }
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    @EventListener
    public void onUserDeleted(UserDeletedEvent event) {
        repository.deleteByUserId(event.userId());
    }
}
