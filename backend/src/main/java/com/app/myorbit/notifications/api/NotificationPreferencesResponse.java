package com.app.myorbit.notifications.api;

import com.app.myorbit.notifications.domain.NotificationPreferences;

public record NotificationPreferencesResponse(boolean deadline, boolean event, boolean habit) {
    public static NotificationPreferencesResponse from(NotificationPreferences preferences) {
        return new NotificationPreferencesResponse(preferences.isDeadline(), preferences.isEvent(), preferences.isHabit());
    }
}
