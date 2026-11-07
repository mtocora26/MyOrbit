package com.app.myorbit.notifications.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/** Qué tipos de aviso quiere recibir un usuario. Sin documento guardado, todos están activados. */
@Document(collection = "notification_preferences")
public class NotificationPreferences {
    @Id
    private String userId;
    private boolean deadline = true;
    private boolean event = true;
    private boolean habit = true;

    public static NotificationPreferences defaultsFor(String userId) {
        NotificationPreferences preferences = new NotificationPreferences();
        preferences.userId = userId;
        return preferences;
    }

    public boolean isEnabled(NotificationType type) {
        return switch (type) {
            case DEADLINE -> deadline;
            case EVENT -> event;
            case HABIT -> habit;
        };
    }

    public void update(boolean deadline, boolean event, boolean habit) {
        this.deadline = deadline;
        this.event = event;
        this.habit = habit;
    }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public boolean isDeadline() { return deadline; }
    public boolean isEvent() { return event; }
    public boolean isHabit() { return habit; }
}
