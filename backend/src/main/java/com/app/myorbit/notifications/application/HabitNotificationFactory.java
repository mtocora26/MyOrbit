package com.app.myorbit.notifications.application;

import com.app.myorbit.notifications.domain.NotificationRequest;
import com.app.myorbit.notifications.domain.NotificationType;
import org.springframework.stereotype.Component;

@Component
class HabitNotificationFactory extends AbstractNotificationFactory {
    @Override
    public NotificationType type() {
        return NotificationType.HABIT;
    }

    @Override
    protected String title(NotificationRequest request) {
        return "Hábito pendiente";
    }

    @Override
    protected String message(NotificationRequest request) {
        return request.when() == null
                ? "Aún no has cumplido el hábito \"" + request.subject() + "\""
                : "Aún no has cumplido el hábito \"" + request.subject() + "\" de hoy (" + format(request.when()) + ")";
    }
}
