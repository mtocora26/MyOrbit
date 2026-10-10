package com.app.myorbit.habits.domain;

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
    public String value() {
        return value;
    }

    public static Optional<HabitFrequency> fromValue(String raw) {
        return Arrays.stream(values()).filter(frequency -> frequency.value.equals(raw)).findFirst();
    }
}
