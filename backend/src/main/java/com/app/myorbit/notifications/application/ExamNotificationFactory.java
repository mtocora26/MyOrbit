package com.app.myorbit.notifications.application;

import com.app.myorbit.notifications.domain.NotificationRequest;
import com.app.myorbit.notifications.domain.NotificationType;
import org.springframework.stereotype.Component;

/** {@code subject} trae «Evaluación (Materia)». */
@Component
class ExamNotificationFactory extends AbstractNotificationFactory {
    @Override
    public NotificationType type() {
        return NotificationType.EXAM;
    }

    @Override
    protected String title(NotificationRequest request) {
        return "Evaluación próxima";
    }

    @Override
    protected String message(NotificationRequest request) {
        return request.when() == null
                ? "Se acerca \"" + request.subject() + "\""
                : "\"" + request.subject() + "\" es el " + format(request.when());
    }
}
