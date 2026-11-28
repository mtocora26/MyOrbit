package com.app.myorbit.users.api;

import com.app.myorbit.users.domain.Role;
import com.app.myorbit.users.domain.User;

/** La cuenta con sesión. {@code token} solo viene al registrarse o iniciar sesión. */
public record AuthResponse(String token, String id, String name, String email, Role role, String timeZone,
                           boolean termsPending) {
    public static AuthResponse of(String token, User user) {
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getTimeZone(),
                user.hasPendingTerms());
    }
}
