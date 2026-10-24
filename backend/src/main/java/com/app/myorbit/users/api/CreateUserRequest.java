package com.app.myorbit.users.api;

import com.app.myorbit.users.domain.Role;

public record CreateUserRequest(String name, String email, String password, Role role) {
}
