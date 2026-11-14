package com.app.myorbit.notifications.application;

import com.app.myorbit.notifications.domain.NotificationRequest;
import com.app.myorbit.notifications.domain.NotificationType;
import org.springframework.stereotype.Component;

@Component
class AtRiskNotificationFactory extends AbstractNotificationFactory {
    @Override
    public NotificationType type() {
        return NotificationType.AT_RISK;
    }

    @Override
    protected String title(NotificationRequest request) {
        return "Materia en riesgo";
    }

    @Override
    protected String message(NotificationRequest request) {
        return "Con tus notas actuales, aprobar \"" + request.subject() + "\" se está poniendo difícil. Revisa qué nota necesitas.";
    }
}
