package com.app.myorbit.users.api;

import com.app.myorbit.users.domain.AgeDeclaration;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AcceptTermsRequest(
        @NotBlank(message = "Debes aceptar los términos y la política de datos") String acceptedTermsVersion,
        @NotNull(message = "Indica si eres mayor de edad o tienes autorización") AgeDeclaration ageDeclaration) {
}
