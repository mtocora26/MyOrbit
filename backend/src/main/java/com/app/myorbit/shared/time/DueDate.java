package com.app.myorbit.shared.time;

import com.app.myorbit.shared.error.BusinessRuleException;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;

/** Fecha límite en ISO-8601 sin zona (2026-10-10T23:59). Texto vacío significa "sin fecha". */
public final class DueDate {
    private DueDate() {
    }

    public static LocalDateTime parse(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDateTime.parse(value.trim());
        } catch (DateTimeParseException invalid) {
            throw new BusinessRuleException("La fecha debe tener el formato AAAA-MM-DDTHH:mm");
        }
    }
}
