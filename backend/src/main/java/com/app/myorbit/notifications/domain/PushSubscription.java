package com.app.myorbit.notifications.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Un dispositivo del usuario que puede recibir avisos push. Un usuario puede tener varios.
 * {@code address} es el endpoint de Web Push o el token de FCM, según {@code channel}; es único porque
 * el mismo dispositivo que inicia sesión con otra cuenta pasa a pertenecer a esa cuenta.
 */
@Document(collection = "push_subscriptions")
public class PushSubscription {
    @Id
    private String id;
    @Indexed
    private String userId;
    private PushChannel channel;
    @Indexed(unique = true)
    private String address;
    /** Solo Web Push: clave pública del navegador. */
    private String p256dh;
    /** Solo Web Push: secreto de autenticación del navegador. */
    private String auth;
    private Instant createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public PushChannel getChannel() { return channel; }
    public void setChannel(PushChannel channel) { this.channel = channel; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getP256dh() { return p256dh; }
    public void setP256dh(String p256dh) { this.p256dh = p256dh; }
    public String getAuth() { return auth; }
    public void setAuth(String auth) { this.auth = auth; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
