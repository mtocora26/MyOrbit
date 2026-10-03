package com.app.myorbit.users.api;

public record RegisterRequest(String name, String email, String password) {
}