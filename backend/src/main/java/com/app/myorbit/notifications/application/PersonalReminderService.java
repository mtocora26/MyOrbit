package com.app.myorbit.notifications.application;

import com.app.myorbit.notifications.domain.NotificationRequest;
import com.app.myorbit.notifications.domain.NotificationType;
import com.app.myorbit.notifications.domain.PersonalReminder;
import com.app.myorbit.notifications.infrastructure.PersonalReminderRepository;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.NotFoundException;
import com.app.myorbit.users.application.UserZoneService;
import com.app.myorbit.users.domain.UserDeletedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** Recordatorios personales: crear, listar los pendientes, borrar y enviarlos a la bandeja a su hora. */
@Service
public class PersonalReminderService {
    public static final int MAX_TEXT_LENGTH = 140;

    private final PersonalReminderRepository repository;
    private final NotificationService notifications;
    private final UserZoneService userZone;

    public PersonalReminderService(PersonalReminderRepository repository, NotificationService notifications, UserZoneService userZone) {
        this.repository = repository;
        this.notifications = notifications;
        this.userZone = userZone;
    }

    /** @param remindAt hora local del usuario; debe ser posterior a su "ahora" */
    public PersonalReminder create(String userId, String text, LocalDateTime remindAt) {
        String clean = text == null ? "" : text.trim();
        if (clean.isEmpty()) throw new BusinessRuleException("Escribe qué quieres recordar");
        if (clean.length() > MAX_TEXT_LENGTH) throw new BusinessRuleException("El recordatorio admite hasta " + MAX_TEXT_LENGTH + " caracteres");
        if (remindAt == null) throw new BusinessRuleException("Elige la fecha y la hora");
        if (!remindAt.isAfter(userZone.now(userId))) throw new BusinessRuleException("Elige una hora en el futuro");
        PersonalReminder reminder = new PersonalReminder();
        reminder.setId(UUID.randomUUID().toString());
        reminder.setUserId(userId);
        reminder.setText(clean);
        reminder.setRemindAt(remindAt);
        return repository.save(reminder);
    }

    /** Los que aún no se enviaron, el más próximo primero. */
    public List<PersonalReminder> listPending(String userId) {
        return repository.findByUserIdAndFiredFalseOrderByRemindAtAsc(userId);
    }

    public void delete(String userId, String id) {
        repository.delete(getOwned(userId, id));
    }

    private PersonalReminder getOwned(String userId, String id) {
        return repository.findById(id)
                .filter(reminder -> reminder.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("Recordatorio no encontrado"));
    }

    /**
     * Envía a la bandeja los recordatorios cuya hora ya llegó ({@code now} es la hora local del usuario) y los marca
     * como enviados. Un recordatorio atrasado (servidor dormido) se envía igual en el siguiente tick. Si el usuario
     * apagó este tipo de aviso, se marca enviado sin crear notificación.
     *
     * @return cuántos recordatorios se procesaron
     */
    public int fireDue(String userId, LocalDateTime now) {
        List<PersonalReminder> due = repository.findByUserIdAndFiredFalseAndRemindAtLessThanEqual(userId, now);
        for (PersonalReminder reminder : due) {
            reminder.setFired(true);
            repository.save(reminder);
            notifications.notify(new NotificationRequest(NotificationType.REMINDER, userId, reminder.getId(), reminder.getText(), reminder.getRemindAt()));
        }
        return due.size();
    }

    @EventListener
    public void onUserDeleted(UserDeletedEvent event) {
        repository.deleteByUserId(event.userId());
    }
}
