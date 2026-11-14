package com.app.myorbit.notifications.api;

import com.app.myorbit.notifications.domain.NotificationPreferences;

public record NotificationPreferencesResponse(boolean deadline, boolean habit, boolean overdue, boolean exam, boolean atRisk, boolean classReminder) {
    public static NotificationPreferencesResponse from(NotificationPreferences preferences) {
        return new NotificationPreferencesResponse(preferences.isDeadline(), preferences.isHabit(), preferences.isOverdue(),
                preferences.isExam(), preferences.isAtRisk(), preferences.isClassReminder());
    }
}
