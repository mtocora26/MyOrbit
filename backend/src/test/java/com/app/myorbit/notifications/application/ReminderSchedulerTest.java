package com.app.myorbit.notifications.application;

import com.app.myorbit.habits.application.HabitService;
import com.app.myorbit.tasks.application.TaskService;
import com.app.myorbit.users.application.UserZoneService;
import com.app.myorbit.users.application.UserZoneService.UserLocalTime;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReminderSchedulerTest {
    // Mismo instante para todos: 2026-11-07 13:00 UTC
    private static final Instant INSTANT = Instant.parse("2026-11-07T13:00:00Z");

    private final HabitService habitService = mock(HabitService.class);
    private final TaskService taskService = mock(TaskService.class);
    private final UserZoneService userZone = mock(UserZoneService.class);
    private final ReminderScheduler scheduler = new ReminderScheduler(habitService, taskService, userZone, 8);

    private UserLocalTime user(String id, String zone) {
        return new UserLocalTime(id, INSTANT.atZone(ZoneId.of(zone)));
    }

    @Test
    void remindsOnlyUsersWhoseLocalHourIsTheReminderHour() {
        // 13:00 UTC = 08:00 en Bogotá, 14:00 en Madrid, 22:00 en Tokio
        when(userZone.activeUsersLocalTime()).thenReturn(List.of(
                user("bogota", "America/Bogota"), user("madrid", "Europe/Madrid"), user("tokio", "Asia/Tokyo")));

        scheduler.run();

        verify(habitService).publishPendingHabits("bogota", LocalDate.of(2026, 11, 7));
        verify(taskService).publishDueSoon("bogota", LocalDateTime.of(2026, 11, 7, 8, 0), LocalDateTime.of(2026, 11, 8, 8, 0));
        verify(habitService, never()).publishPendingHabits(org.mockito.ArgumentMatchers.eq("madrid"), any());
        verify(habitService, never()).publishPendingHabits(org.mockito.ArgumentMatchers.eq("tokio"), any());
    }

    @Test
    void usesTheUsersLocalDateEvenWhenItDiffersFromTheServersDate() {
        // 2026-11-07 20:00 UTC = 2026-11-08 05:00 en Tokio -> el recordatorio de las 08:00 de Tokio es otro instante;
        // aquí comprobamos el día local con 23:00 UTC = 08:00 del 8 de noviembre en Tokio.
        Instant instant = Instant.parse("2026-11-07T23:00:00Z");
        when(userZone.activeUsersLocalTime()).thenReturn(List.of(new UserLocalTime("tokio", instant.atZone(ZoneId.of("Asia/Tokyo")))));

        scheduler.run();

        verify(habitService).publishPendingHabits("tokio", LocalDate.of(2026, 11, 8));
        verify(taskService).publishDueSoon("tokio", LocalDateTime.of(2026, 11, 8, 8, 0), LocalDateTime.of(2026, 11, 9, 8, 0));
    }

    @Test
    void aFailingJobDoesNotStopTheOtherNorOtherUsers() {
        when(userZone.activeUsersLocalTime()).thenReturn(List.of(user("a", "America/Bogota"), user("b", "America/Bogota")));
        when(habitService.publishPendingHabits(org.mockito.ArgumentMatchers.eq("a"), any())).thenThrow(new IllegalStateException("mongo caído"));

        scheduler.run();

        verify(taskService).publishDueSoon(org.mockito.ArgumentMatchers.eq("a"), any(), any());
        verify(habitService).publishPendingHabits("b", LocalDate.of(2026, 11, 7));
        verify(taskService).publishDueSoon(org.mockito.ArgumentMatchers.eq("b"), any(), any());
    }

    @Test
    void failingToLoadUsersDoesNotThrow() {
        when(userZone.activeUsersLocalTime()).thenThrow(new IllegalStateException("mongo caído"));

        scheduler.run();

        verify(habitService, never()).publishPendingHabits(anyString(), any());
    }

    @Test
    void doesNothingWhenNobodyIsAtTheReminderHour() {
        when(userZone.activeUsersLocalTime()).thenReturn(List.of(user("madrid", "Europe/Madrid")));

        scheduler.run();

        verify(habitService, never()).publishPendingHabits(anyString(), any());
        verify(taskService, never()).publishDueSoon(anyString(), any(), any());
    }
}
