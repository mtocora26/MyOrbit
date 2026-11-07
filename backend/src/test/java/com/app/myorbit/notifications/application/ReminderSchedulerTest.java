package com.app.myorbit.notifications.application;

import com.app.myorbit.habits.application.HabitService;
import com.app.myorbit.tasks.application.TaskService;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReminderSchedulerTest {
    private final HabitService habitService = mock(HabitService.class);
    private final TaskService taskService = mock(TaskService.class);
    private final Clock clock = Clock.fixed(Instant.parse("2026-11-07T08:00:00Z"), ZoneOffset.UTC);
    private final ReminderScheduler scheduler = new ReminderScheduler(habitService, taskService, clock);

    @Test
    void runPublishesPendingHabitsOfTodayAndTasksDueInTheNext24Hours() {
        scheduler.run();

        verify(habitService).publishPendingHabits(LocalDate.of(2026, 11, 7));
        verify(taskService).publishDueSoon(LocalDateTime.of(2026, 11, 7, 8, 0), LocalDateTime.of(2026, 11, 8, 8, 0));
    }

    @Test
    void aFailingJobDoesNotStopTheOther() {
        when(habitService.publishPendingHabits(LocalDate.of(2026, 11, 7))).thenThrow(new IllegalStateException("mongo caído"));

        scheduler.run();

        verify(taskService).publishDueSoon(LocalDateTime.of(2026, 11, 7, 8, 0), LocalDateTime.of(2026, 11, 8, 8, 0));
    }
}
