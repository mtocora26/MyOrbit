package com.app.myorbit.notifications.infrastructure;

import com.app.myorbit.notifications.domain.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.app.myorbit.notifications.domain.NotificationType;

import java.time.Instant;
import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Notification> findByUserIdAndReadFalseOrderByCreatedAtDesc(String userId);

    long countByUserIdAndReadFalse(String userId);

    boolean existsByUserIdAndTypeAndReferenceIdAndCreatedAtGreaterThanEqual(String userId, NotificationType type, String referenceId, Instant since);
}
