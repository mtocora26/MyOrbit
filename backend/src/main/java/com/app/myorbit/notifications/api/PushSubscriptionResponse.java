package com.app.myorbit.notifications.api;

import com.app.myorbit.notifications.domain.PushChannel;
import com.app.myorbit.notifications.domain.PushSubscription;

import java.time.Instant;

public record PushSubscriptionResponse(String id, PushChannel channel, String address, Instant createdAt) {
    public static PushSubscriptionResponse from(PushSubscription subscription) {
        return new PushSubscriptionResponse(subscription.getId(), subscription.getChannel(), subscription.getAddress(), subscription.getCreatedAt());
    }
}
