package com.app.myorbit.notifications.application;

import com.app.myorbit.academic.application.AcademicReminderService;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReminderSchedulerTest {
    // 13:00 UTC = 08:00 en Bogotá (hora de la mañana), 15:00 en Madrid... y 20:00 en Bogotá es 01:00 UTC del día siguiente
    private static final Instant MORNING = Instant.parse("2026-11-07T13:00:00Z");
    private static final Instant EVENING_BOGOTA = Instant.parse("2026-11-08T01:00:00Z");

    private final HabitService habitService = mock(HabitService.class);
    private final TaskService taskService = mock(TaskService.class);
    private final UserZoneService userZone = mock(UserZoneService.class);
    private final AcademicReminderService academic = mock(AcademicReminderService.class);
    private final ReminderScheduler scheduler = new ReminderScheduler(habitService, taskService, userZone, academic, 8, 20);

    private UserLocalTime user(String id, String zone, Instant instant) {
        return new UserLocalTime(id, instant.atZone(ZoneId.of(zone)));
    }

    @Test
    void morningSummariesRunOnlyAtTheUsersMorningHour() {
        // 13:00 UTC = 08:00 en Bogotá, 14:00 en Madrid, 22:00 en Tokio
        when(userZone.activeUsersLocalTime()).thenReturn(List.of(
                user("bogota", "America/Bogota", MORNING), user("madrid", "Europe/Madrid", MORNING), user("tokio", "Asia/Tokyo", MORNING)));

        scheduler.run();

        LocalDateTime local = LocalDateTime.of(2026, 11, 7, 8, 0);
        verify(taskService).publishOverdue("bogota", local);
        verify(academic).publishExamsSoon("bogota", local, local.plusDays(3));
        verify(academic).publishSubjectsAtRisk("bogota", LocalDate.of(2026, 11, 7));
        verify(taskService, never()).publishOverdue(eq("madrid"), any());
        verify(taskService, never()).publishOverdue(eq("tokio"), any());
        verify(academic, never()).publishExamsSoon(eq("madrid"), any(), any());
    }

    @Test
    void habitsAreRemindedInTheEveningNotInTheMorning() {
        when(userZone.activeUsersLocalTime()).thenReturn(List.of(user("bogota", "America/Bogota", MORNING)));
        scheduler.run();
        verify(habitService, never()).publishPendingHabits(anyString(), any());

        when(userZone.activeUsersLocalTime()).thenReturn(List.of(user("bogota", "America/Bogota", EVENING_BOGOTA)));
        scheduler.run();
        verify(habitService).publishPendingHabits("bogota", LocalDate.of(2026, 11, 7));
    }

    @Test
    void deadlineRemindersRunEveryHourForEveryUser() {
        when(userZone.activeUsersLocalTime()).thenReturn(List.of(user("madrid", "Europe/Madrid", MORNING)));

        scheduler.run();

        LocalDateTime local = LocalDateTime.of(2026, 11, 7, 14, 0);
        verify(taskService).publishDueSoon("madrid", local.plusHours(23), local.plusHours(24), false);
        verify(taskService).publishDueSoon("madrid", local, local.plusHours(1), true);
    }

    @Test
    void usesTheUsersLocalDateEvenWhenItDiffersFromTheServersDate() {
        // 23:00 UTC del 7 = 08:00 del 8 de noviembre en Tokio
        Instant instant = Instant.parse("2026-11-07T23:00:00Z");
        when(userZone.activeUsersLocalTime()).thenReturn(List.of(user("tokio", "Asia/Tokyo", instant)));

        scheduler.run();

        verify(taskService).publishOverdue("tokio", LocalDateTime.of(2026, 11, 8, 8, 0));
        verify(academic).publishSubjectsAtRisk("tokio", LocalDate.of(2026, 11, 8));
    }

    @Test
    void aFailingJobDoesNotStopTheOthersNorOtherUsers() {
        when(userZone.activeUsersLocalTime()).thenReturn(List.of(user("a", "America/Bogota", MORNING), user("b", "America/Bogota", MORNING)));
        when(taskService.publishOverdue(eq("a"), any())).thenThrow(new IllegalStateException("mongo caído"));

        scheduler.run();

        verify(academic).publishExamsSoon(eq("a"), any(), any());
        verify(taskService).publishOverdue(eq("b"), any());
        verify(academic).publishSubjectsAtRisk(eq("b"), any());
    }

    @Test
    void failingToLoadUsersDoesNotThrow() {
        when(userZone.activeUsersLocalTime()).thenThrow(new IllegalStateException("mongo caído"));

        scheduler.run();

        verify(taskService, never()).publishDueSoon(anyString(), any(), any(), org.mockito.ArgumentMatchers.anyBoolean());
    }
}
