package com.app.myorbit.users.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import com.app.myorbit.users.domain.Role;

public record CreateUserRequest(
        @NotBlank(message = "El nombre es obligatorio") @Size(max = 100, message = "El nombre es demasiado largo") String name,
        @NotBlank(message = "El correo es obligatorio") @Email(message = "Ingresa un correo valido") String email,
        @NotBlank(message = "La contrasena es obligatoria") @Size(min = 8, message = "La contrasena debe tener al menos 8 caracteres") String password,
        Role role) {
}
