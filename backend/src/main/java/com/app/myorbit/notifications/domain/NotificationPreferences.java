package com.app.myorbit.notifications.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/** Qué tipos de aviso quiere recibir un usuario. Sin documento guardado, todos están activados. */
@Document(collection = "notification_preferences")
public class NotificationPreferences {
    @Id
    private String userId;
    private boolean deadline = true;
    private boolean habit = true;
    private boolean overdue = true;
    private boolean exam = true;
    private boolean atRisk = true;
    private boolean classReminder = true;
    private boolean reminder = true;

    public static NotificationPreferences defaultsFor(String userId) {
        NotificationPreferences preferences = new NotificationPreferences();
        preferences.userId = userId;
        return preferences;
    }

    public boolean isEnabled(NotificationType type) {
        return switch (type) {
            case DEADLINE -> deadline;
            case HABIT -> habit;
            case OVERDUE -> overdue;
            case EXAM -> exam;
            case AT_RISK -> atRisk;
            case CLASS -> classReminder;
            case REMINDER -> reminder;
        };
    }

    public void update(boolean deadline, boolean habit, boolean overdue, boolean exam, boolean atRisk, boolean classReminder) {
        this.deadline = deadline;
        this.habit = habit;
        this.overdue = overdue;
        this.exam = exam;
        this.atRisk = atRisk;
        this.classReminder = classReminder;
    }

    /** Aparte de {@link #update} para que un cliente anterior a los recordatorios no los apague sin querer. */
    public void setReminder(boolean reminder) { this.reminder = reminder; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public boolean isDeadline() { return deadline; }
    public boolean isHabit() { return habit; }
    public boolean isOverdue() { return overdue; }
    public boolean isExam() { return exam; }
    public boolean isAtRisk() { return atRisk; }
    public boolean isClassReminder() { return classReminder; }
    public boolean isReminder() { return reminder; }
}
