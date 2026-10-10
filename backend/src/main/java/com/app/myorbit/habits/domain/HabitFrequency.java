package com.app.myorbit.habits.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;
import java.util.Optional;

public enum HabitFrequency {
    DAILY("diaria"),
    CUSTOM("personalizada");

    private final String value;

    HabitFrequency(String value) {
        this.value = value;
    }

    /** Valor que se guarda en Mongo y viaja en la API. */
    @JsonValue
    public String value() {
        return value;
    }

    @JsonCreator
    public static HabitFrequency parse(String raw) {
        return fromValue(raw).orElseThrow(() -> new IllegalArgumentException("Frecuencia no valida: " + raw));
    }

    public static Optional<HabitFrequency> fromValue(String raw) {
        return Arrays.stream(values()).filter(frequency -> frequency.value.equals(raw)).findFirst();
    }
}
