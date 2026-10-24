package com.app.myorbit.users.api;

import com.app.myorbit.users.domain.Role;

/** Campos nulos no se modifican. */
public record UpdateUserRequest(String name, Role role, Boolean active) {
}
