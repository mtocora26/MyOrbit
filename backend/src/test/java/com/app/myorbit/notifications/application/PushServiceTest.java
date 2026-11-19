package com.app.myorbit.notifications.application;

import com.app.myorbit.notifications.domain.PushChannel;
import com.app.myorbit.notifications.domain.PushMessage;
import com.app.myorbit.notifications.domain.PushResult;
import com.app.myorbit.notifications.domain.PushSender;
import com.app.myorbit.notifications.domain.PushSubscription;
import com.app.myorbit.notifications.infrastructure.PushSubscriptionRepository;
import com.app.myorbit.shared.error.BusinessRuleException;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PushServiceTest {
    private final PushSubscriptionRepository repository = mock(PushSubscriptionRepository.class);
    private final PushSender webSender = mock(PushSender.class);
    private final Clock clock = Clock.fixed(Instant.parse("2026-11-19T12:00:00Z"), ZoneOffset.UTC);

    private PushService service(String publicKey) {
        when(webSender.channel()).thenReturn(PushChannel.WEB);
        return new PushService(repository, List.of(webSender), clock, publicKey);
    }

    private PushSubscription web(String id, String address) {
        PushSubscription subscription = new PushSubscription();
        subscription.setId(id);
        subscription.setUserId("u1");
        subscription.setChannel(PushChannel.WEB);
        subscription.setAddress(address);
        return subscription;
    }

    @Test
    void registerMovesAnExistingDeviceToTheCurrentUser() {
        PushSubscription existing = web("s1", "https://push/abc");
        existing.setUserId("otra");
        when(repository.findByAddress("https://push/abc")).thenReturn(Optional.of(existing));
        when(repository.save(any(PushSubscription.class))).then(returnsFirstArg());

        PushSubscription saved = service("k").register("u1", PushChannel.WEB, "https://push/abc", "p", "a");

        assertEquals("u1", saved.getUserId());
        assertEquals("s1", saved.getId());
    }

    @Test
    void registerRejectsWebPushWithoutKeys() {
        assertThrows(BusinessRuleException.class, () -> service("k").register("u1", PushChannel.WEB, "https://push/abc", null, "a"));
        verify(repository, never()).save(any());
    }

    @Test
    void deliverRemovesDevicesThatNoLongerExist() {
        PushSubscription gone = web("s1", "https://push/gone");
        PushSubscription alive = web("s2", "https://push/alive");
        when(repository.findByUserId("u1")).thenReturn(List.of(gone, alive));
        when(webSender.send(gone, new PushMessage("t", "m", "n1"))).thenReturn(PushResult.GONE);
        when(webSender.send(alive, new PushMessage("t", "m", "n1"))).thenReturn(PushResult.SENT);

        service("k").deliverNow("u1", new PushMessage("t", "m", "n1"));

        verify(repository).delete(gone);
        verify(repository, never()).delete(alive);
    }

    @Test
    void publicKeyIsNullWhenNotConfigured() {
        assertNull(service("").webPublicKey());
    }
}
