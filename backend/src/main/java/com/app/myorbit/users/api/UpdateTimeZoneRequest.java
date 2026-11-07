package com.app.myorbit.users.api;

import jakarta.validation.constraints.NotBlank;

public record UpdateTimeZoneRequest(@NotBlank(message = "La zona horaria es obligatoria") String timeZone) {
}
