package com.app.myorbit.academic.domain;

import java.time.LocalDateTime;

/** Una clase está por empezar; la publica el planificador de avisos. {@code room} puede ser null. */
public record ClassStartingEvent(String userId, String subjectId, String subjectName, String room, LocalDateTime startsAt) {
}
