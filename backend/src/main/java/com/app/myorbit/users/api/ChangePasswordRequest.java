package com.app.myorbit.users.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "La contrasena actual es obligatoria") String currentPassword,
        @NotBlank(message = "La contrasena es obligatoria") @Size(min = 8, message = "La contrasena debe tener al menos 8 caracteres") String newPassword) {
}
