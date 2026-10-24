package com.app.myorbit.users.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "user_sessions")
public class UserSession {
    @Id
    private String token;
    private String userId;

    /** Mongo borra el documento al llegar esta fecha (indice TTL). Las sesiones antiguas no la tienen. */
    @Indexed(expireAfter = "0s")
    private Instant expiresAt;

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
}