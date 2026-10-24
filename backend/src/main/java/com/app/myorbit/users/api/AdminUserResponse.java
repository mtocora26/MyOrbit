package com.app.myorbit.users.api;

import com.app.myorbit.users.domain.Role;
import com.app.myorbit.users.domain.User;

import java.time.Instant;

public record AdminUserResponse(String id, String name, String email, Role role, boolean active, Instant createdAt) {
    public static AdminUserResponse from(User user) {
        return new AdminUserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.isActive(), user.getCreatedAt());
    }
}
