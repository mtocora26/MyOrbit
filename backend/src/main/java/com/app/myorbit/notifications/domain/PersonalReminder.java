package com.app.myorbit.notifications.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Recordatorio que el usuario programa. {@code remindAt} es la hora local del usuario (sin zona), como se
 * eligió en pantalla; el planificador la compara con la hora local actual de cada usuario.
 */
@Document(collection = "personal_reminders")
public class PersonalReminder {
    @Id
    private String id;
    private String userId;
    private String text;
    private LocalDateTime remindAt;
    /** true cuando ya se envió a la bandeja; evita repetirlo. */
    private boolean fired;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public LocalDateTime getRemindAt() { return remindAt; }
    public void setRemindAt(LocalDateTime remindAt) { this.remindAt = remindAt; }
    public boolean isFired() { return fired; }
    public void setFired(boolean fired) { this.fired = fired; }
}
