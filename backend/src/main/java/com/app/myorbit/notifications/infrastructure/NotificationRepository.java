package com.app.myorbit.notifications.infrastructure;

import com.app.myorbit.notifications.domain.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface NotificationRepository extends MongoRepository<Notification, String> {
}
