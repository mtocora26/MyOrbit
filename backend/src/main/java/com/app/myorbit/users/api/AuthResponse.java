package com.app.myorbit.users.api;

import com.app.myorbit.users.domain.Role;

public record AuthResponse(String token, String id, String name, String email, Role role) {
}
