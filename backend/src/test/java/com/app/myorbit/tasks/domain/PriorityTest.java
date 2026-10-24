package com.app.myorbit.tasks.domain;

import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PriorityTest {
    @Test
    void parsesApiValuesIgnoringCase() {
        assertEquals(Optional.of(Priority.HIGH), Priority.fromValue("ALTA"));
        assertEquals(Optional.of(Priority.LOW), Priority.fromValue("baja"));
    }

    @Test
    void unknownOrNullValuesAreEmpty() {
        assertEquals(Optional.empty(), Priority.fromValue("urgente"));
        assertEquals(Optional.empty(), Priority.fromValue(null));
    }

    @Test
    void keepsStoredValueStable() {
        assertEquals("media", Priority.MEDIUM.value());
    }
}
