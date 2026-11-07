package com.app.myorbit.users.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.DateTimeException;
import java.time.Instant;
import java.time.ZoneId;

@Document(collection = "users")
public class User {
    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    private String passwordHash;

    // Cuentas creadas antes de existir la gestion de usuarios no tienen estos campos:
    // se leen como USER, activa.
    private Role role;
    private Boolean active;
    private Instant createdAt;
    /** Zona horaria IANA elegida por el usuario (America/Bogota); null = no la ha fijado. */
    private String timeZone;
    public static final String DEFAULT_TIME_ZONE = "America/Bogota";

    public String getTimeZone() { return timeZone; }
    public void setTimeZone(String timeZone) { this.timeZone = timeZone; }

    /** Zona con la que se calculan "hoy" y las horas de los avisos; si no hay una válida guardada, la de Colombia. */
    public ZoneId zone() {
        try {
            return ZoneId.of(timeZone == null || timeZone.isBlank() ? DEFAULT_TIME_ZONE : timeZone);
        } catch (DateTimeException invalid) {
            return ZoneId.of(DEFAULT_TIME_ZONE);
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public Role getRole() { return role == null ? Role.USER : role; }
    public void setRole(Role role) { this.role = role; }
    public boolean isActive() { return active == null || active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public boolean isAdmin() { return getRole() == Role.ADMIN; }
}
