package com.app.myorbit.users.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateNameRequest(
        @NotBlank(message = "El nombre es obligatorio") @Size(max = 100, message = "El nombre es demasiado largo") String name) {
}
