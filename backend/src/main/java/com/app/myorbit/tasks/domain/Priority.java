package com.app.myorbit.tasks.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;
import java.util.Optional;

public enum Priority {
    HIGH("alta"),
    MEDIUM("media"),
    LOW("baja");

    private final String value;

    Priority(String value) {
        this.value = value;
    }

    /** Valor que se guarda en Mongo y viaja en la API. */
    @JsonValue
    public String value() {
        return value;
    }

    @JsonCreator
    public static Priority parse(String raw) {
        return fromValue(raw).orElseThrow(() -> new IllegalArgumentException("Prioridad no valida: " + raw));
    }

    public static Optional<Priority> fromValue(String raw) {
        if (raw == null) return Optional.empty();
        String normalized = raw.trim().toLowerCase();
        return Arrays.stream(values()).filter(priority -> priority.value.equals(normalized)).findFirst();
    }
}
