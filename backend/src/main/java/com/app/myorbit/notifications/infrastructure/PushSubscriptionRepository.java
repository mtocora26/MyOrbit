package com.app.myorbit.notifications.infrastructure;

import com.app.myorbit.notifications.domain.PushSubscription;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface PushSubscriptionRepository extends MongoRepository<PushSubscription, String> {
    List<PushSubscription> findByUserId(String userId);

    Optional<PushSubscription> findByAddress(String address);

    long deleteByUserIdAndAddress(String userId, String address);
}
