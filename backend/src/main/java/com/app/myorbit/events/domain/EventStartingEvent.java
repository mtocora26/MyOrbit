package com.app.myorbit.events.domain;

import java.time.LocalDateTime;

/** Un evento con hora empieza ahora; lo publica el planificador de avisos. */
public record EventStartingEvent(String userId, String eventId, String title, LocalDateTime startsAt) {
}
