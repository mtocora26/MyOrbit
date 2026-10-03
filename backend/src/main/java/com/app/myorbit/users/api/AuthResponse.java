package com.app.myorbit.users.api;

public record AuthResponse(String token, String id, String name, String email) {
}