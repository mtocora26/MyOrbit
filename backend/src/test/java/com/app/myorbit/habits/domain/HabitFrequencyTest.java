package com.app.myorbit.habits.domain;

import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;

class HabitFrequencyTest {
    @Test
    void parsesApiValues() {
        assertEquals(Optional.of(HabitFrequency.CUSTOM), HabitFrequency.fromValue("personalizada"));
        assertEquals(Optional.of(HabitFrequency.DAILY), HabitFrequency.fromValue("diaria"));
    }

    @Test
    void unknownValuesAreEmpty() {
        assertEquals(Optional.empty(), HabitFrequency.fromValue("semanal"));
        assertEquals(Optional.empty(), HabitFrequency.fromValue(null));
    }
}
