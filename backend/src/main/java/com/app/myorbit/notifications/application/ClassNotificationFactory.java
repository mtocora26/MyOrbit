package com.app.myorbit.notifications.application;

import com.app.myorbit.notifications.domain.NotificationRequest;
import com.app.myorbit.notifications.domain.NotificationType;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;

/** Aviso de agenda: {@code subject} describe qué empieza («clase de Cálculo», «el evento "Feria"») y {@code when} cuándo. */
@Component
class ClassNotificationFactory extends AbstractNotificationFactory {
    private static final DateTimeFormatter HOUR = DateTimeFormatter.ofPattern("HH:mm");

    @Override
    public NotificationType type() {
        return NotificationType.CLASS;
    }

    @Override
    protected String title(NotificationRequest request) {
        return "En tu agenda";
    }

    @Override
    protected String message(NotificationRequest request) {
        return request.when() == null
                ? "Tienes " + request.subject()
                : "Tienes " + request.subject() + " a las " + HOUR.format(request.when());
    }
}
