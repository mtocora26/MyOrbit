package com.app.myorbit.notifications.infrastructure;

import com.app.myorbit.notifications.domain.NotificationPreferences;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface NotificationPreferencesRepository extends MongoRepository<NotificationPreferences, String> {
}
