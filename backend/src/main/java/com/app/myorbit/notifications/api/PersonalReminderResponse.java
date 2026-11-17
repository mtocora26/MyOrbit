package com.app.myorbit.notifications.api;

import com.app.myorbit.notifications.domain.PersonalReminder;

import java.time.LocalDateTime;

public record PersonalReminderResponse(String id, String text, LocalDateTime remindAt) {
    public static PersonalReminderResponse from(PersonalReminder reminder) {
        return new PersonalReminderResponse(reminder.getId(), reminder.getText(), reminder.getRemindAt());
    }
}
