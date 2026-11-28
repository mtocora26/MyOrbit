package com.app.myorbit.users.api;

import jakarta.validation.constraints.NotBlank;

public record DeleteAccountRequest(
        @NotBlank(message = "Escribe tu contraseña para confirmar") String password) {
}
