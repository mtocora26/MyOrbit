package com.app.myorbit.notifications.application;

import com.app.myorbit.academic.application.ClassReminderService;
import com.app.myorbit.events.application.EventReminderService;
import com.app.myorbit.users.application.UserZoneService;
import com.app.myorbit.users.application.UserZoneService.UserLocalTime;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ClassReminderSchedulerTest {
    // 13:00 UTC = 08:00 en Bogotá y 22:00 en Tokio
    private static final Instant INSTANT = Instant.parse("2026-11-09T13:00:00Z");

    private final ClassReminderService classes = mock(ClassReminderService.class);
    private final EventReminderService events = mock(EventReminderService.class);
    private final UserZoneService userZone = mock(UserZoneService.class);
    private final ClassReminderScheduler scheduler = new ClassReminderScheduler(classes, events, userZone);

    private UserLocalTime user(String id, String zone) {
        return new UserLocalTime(id, INSTANT.atZone(ZoneId.of(zone)));
    }

    @Test
    void checksEveryUserWithTheirOwnLocalTime() {
        when(userZone.activeUsersLocalTime()).thenReturn(List.of(user("bogota", "America/Bogota"), user("tokio", "Asia/Tokyo")));

        scheduler.run();

        verify(classes).publishClassesStartingSoon("bogota", LocalDateTime.of(2026, 11, 9, 8, 0), 30);
        verify(classes).publishClassesStartingSoon("tokio", LocalDateTime.of(2026, 11, 9, 22, 0), 30);
        verify(events).publishEventsStarting("bogota", LocalDateTime.of(2026, 11, 9, 8, 0), 5);
    }

    @Test
    void aFailureForOneUserDoesNotStopTheRest() {
        when(userZone.activeUsersLocalTime()).thenReturn(List.of(user("a", "America/Bogota"), user("b", "America/Bogota")));
        when(classes.publishClassesStartingSoon(eq("a"), any(), anyInt())).thenThrow(new IllegalStateException("mongo caído"));

        scheduler.run();

        verify(events).publishEventsStarting(eq("a"), any(), anyInt());
        verify(classes).publishClassesStartingSoon(eq("b"), any(), anyInt());
    }

    @Test
    void failingToLoadUsersDoesNotThrow() {
        when(userZone.activeUsersLocalTime()).thenThrow(new IllegalStateException("mongo caído"));

        scheduler.run();

        verify(classes, never()).publishClassesStartingSoon(anyString(), any(), anyInt());
    }
}
