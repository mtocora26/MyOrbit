package com.app.myorbit.notifications.application;

import com.app.myorbit.notifications.domain.NotificationPreferences;
import com.app.myorbit.notifications.domain.NotificationType;
import com.app.myorbit.notifications.infrastructure.NotificationPreferencesRepository;
import org.springframework.stereotype.Service;

@Service
public class NotificationPreferencesService {
    private final NotificationPreferencesRepository repository;

    public NotificationPreferencesService(NotificationPreferencesRepository repository) {
        this.repository = repository;
    }

    /** Las preferencias guardadas o, si el usuario nunca las cambió, todo activado. */
    public NotificationPreferences get(String userId) {
        return repository.findById(userId).orElseGet(() -> NotificationPreferences.defaultsFor(userId));
    }

    public NotificationPreferences update(String userId, boolean deadline, boolean habit, boolean overdue, boolean exam, boolean atRisk) {
        NotificationPreferences preferences = get(userId);
        preferences.update(deadline, habit, overdue, exam, atRisk);
        return repository.save(preferences);
    }

    public boolean isEnabled(String userId, NotificationType type) {
        return get(userId).isEnabled(type);
    }
}
