package com.app.myorbit.habits.application;

import com.app.myorbit.habits.api.UpdateHabitCompletionRequest;
import com.app.myorbit.habits.api.UpdateHabitRequest;
import com.app.myorbit.habits.domain.HabitFrequency;
import com.app.myorbit.habits.domain.HabitPendingEvent;
import com.app.myorbit.habits.domain.HabitStats;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.habits.domain.Habit;
import com.app.myorbit.habits.infrastructure.HabitRepository;
import com.app.myorbit.shared.error.NotFoundException;
import org.junit.jupiter.api.Test;
import com.app.myorbit.users.application.UserZoneService;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class HabitServiceTest {
    private final HabitRepository repository = mock(HabitRepository.class);
    private final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    private final UserZoneService userZone = mock(UserZoneService.class);
    private final HabitService service = new HabitService(repository, userZone, events);

    {
        // Hoy es 2026-10-10 para cualquier usuario, salvo que un test diga otra cosa.
        when(userZone.today(org.mockito.ArgumentMatchers.anyString())).thenReturn(java.time.LocalDate.of(2026, 10, 10));
    }

    private Habit habitOf(String userId) {
        Habit habit = new Habit();
        habit.setId("h1");
        habit.setUserId(userId);
        return habit;
    }

    @Test
    void getOwnedReturnsHabitOfTheUser() {
        Habit habit = habitOf("u1");
        when(repository.findById("h1")).thenReturn(Optional.of(habit));

        assertSame(habit, service.getOwned("u1", "h1"));
    }

    @Test
    void getOwnedHidesHabitsOfOtherUsers() {
        when(repository.findById("h1")).thenReturn(Optional.of(habitOf("u2")));

        assertThrows(NotFoundException.class, () -> service.getOwned("u1", "h1"));
    }

    @Test
    void completionWithoutDateUsesTheClock() {
        Habit habit = habitOf("u1");
        when(repository.findById("h1")).thenReturn(Optional.of(habit));
        when(repository.save(any(Habit.class))).then(returnsFirstArg());

        Habit saved = service.updateCompletion("u1", "h1", new UpdateHabitCompletionRequest(true, null));

        assertEquals(java.util.List.of("2026-10-10"), saved.getCompletedDates());
    }

    @Test
    void completionAcceptsAnIsoDate() {
        Habit habit = habitOf("u1");
        when(repository.findById("h1")).thenReturn(Optional.of(habit));
        when(repository.save(any(Habit.class))).then(returnsFirstArg());

        Habit saved = service.updateCompletion("u1", "h1", new UpdateHabitCompletionRequest(true, "2026-09-30"));

        assertEquals(List.of("2026-09-30"), saved.getCompletedDates());
    }

    @Test
    void completionRejectsInvalidDatesWithoutSaving() {
        for (String invalid : new String[]{"hoy", "10/10/2026", "2026-10-1", "2026-13-01", "2026-02-30", "2026-10-10T08:00"}) {
            Habit habit = habitOf("u1");
            when(repository.findById("h1")).thenReturn(Optional.of(habit));

            assertThrows(BusinessRuleException.class,
                    () -> service.updateCompletion("u1", "h1", new UpdateHabitCompletionRequest(true, invalid)), invalid);
            assertEquals(List.of(), habit.getCompletedDates(), invalid);
        }
        org.mockito.Mockito.verify(repository, org.mockito.Mockito.never()).save(any(Habit.class));
    }

    @Test
    void uncheckingAlsoValidatesTheDate() {
        when(repository.findById("h1")).thenReturn(Optional.of(habitOf("u1")));

        assertThrows(BusinessRuleException.class,
                () -> service.updateCompletion("u1", "h1", new UpdateHabitCompletionRequest(false, "basura")));
    }

    private Habit existing() {
        Habit habit = habitOf("u1");
        habit.setTitle("Leer");
        habit.setFrequency(HabitFrequency.CUSTOM);
        habit.setDaysOfWeek(List.of(1, 3));
        habit.setColor("#7A5AF8");
        habit.setIcon("book");
        habit.setCompletedDates(new java.util.ArrayList<>(List.of("2026-10-01")));
        return habit;
    }

    @Test
    void updateChangesFieldsAndKeepsHistory() {
        Habit habit = existing();
        when(repository.findById("h1")).thenReturn(Optional.of(habit));
        when(repository.save(any(Habit.class))).then(returnsFirstArg());

        Habit updated = service.update("u1", "h1",
                new UpdateHabitRequest("  Correr ", HabitFrequency.CUSTOM, List.of(2, 4, 4, 9), "#12B76A", "run"));

        assertEquals("Correr", updated.getTitle());
        assertEquals(List.of(2, 4), updated.getDaysOfWeek());
        assertEquals("#12B76A", updated.getColor());
        assertEquals("run", updated.getIcon());
        assertEquals(List.of("2026-10-01"), updated.getCompletedDates());
    }

    @Test
    void updateWithoutOptionalFieldsKeepsCurrentValues() {
        Habit habit = existing();
        when(repository.findById("h1")).thenReturn(Optional.of(habit));
        when(repository.save(any(Habit.class))).then(returnsFirstArg());

        Habit updated = service.update("u1", "h1", new UpdateHabitRequest("Leer mas", null, null, null, null));

        assertEquals(HabitFrequency.CUSTOM, updated.getFrequency());
        assertEquals(List.of(1, 3), updated.getDaysOfWeek());
        assertEquals("#7A5AF8", updated.getColor());
        assertEquals("book", updated.getIcon());
    }

    @Test
    void updateToDailyResetsDaysToTheWholeWeek() {
        Habit habit = existing();
        when(repository.findById("h1")).thenReturn(Optional.of(habit));
        when(repository.save(any(Habit.class))).then(returnsFirstArg());

        Habit updated = service.update("u1", "h1", new UpdateHabitRequest("Leer", HabitFrequency.DAILY, List.of(1), null, null));

        assertEquals(List.of(1, 2, 3, 4, 5, 6, 7), updated.getDaysOfWeek());
    }

    @Test
    void updateRejectsBlankTitle() {
        when(repository.findById("h1")).thenReturn(Optional.of(existing()));

        assertThrows(BusinessRuleException.class, () -> service.update("u1", "h1", new UpdateHabitRequest(" ", null, null, null, null)));
    }

    @Test
    void updateHidesHabitsOfOtherUsers() {
        when(repository.findById("h1")).thenReturn(Optional.of(habitOf("u2")));

        assertThrows(NotFoundException.class, () -> service.update("u1", "h1", new UpdateHabitRequest("X", null, null, null, null)));
    }

    private Habit scheduled(String id, String userId, HabitFrequency frequency, List<Integer> days, String... done) {
        Habit habit = habitOf(userId);
        habit.setId(id);
        habit.setTitle("H" + id);
        habit.setFrequency(frequency);
        habit.setDaysOfWeek(days);
        habit.setCompletedDates(new java.util.ArrayList<>(List.of(done)));
        return habit;
    }

    @Test
    void publishPendingHabitsNotifiesOnlyScheduledAndNotDone() {
        // 2026-10-10 es sábado (6)
        java.time.LocalDate saturday = java.time.LocalDate.of(2026, 10, 10);
        Habit daily = scheduled("a", "u1", HabitFrequency.DAILY, List.of(1, 2, 3, 4, 5, 6, 7));
        Habit dailyDone = scheduled("b", "u1", HabitFrequency.DAILY, List.of(1, 2, 3, 4, 5, 6, 7), "2026-10-10");
        Habit customToday = scheduled("c", "u1", HabitFrequency.CUSTOM, List.of(6));
        Habit customOtherDay = scheduled("d", "u1", HabitFrequency.CUSTOM, List.of(1, 3));
        when(repository.findByUserIdOrderByTitleAsc("u1")).thenReturn(List.of(daily, dailyDone, customToday, customOtherDay));

        int count = service.publishPendingHabits("u1", saturday);

        assertEquals(2, count);
        org.mockito.Mockito.verify(events).publishEvent(new HabitPendingEvent("u1", "a", "Ha", saturday));
        org.mockito.Mockito.verify(events).publishEvent(new HabitPendingEvent("u1", "c", "Hc", saturday));
        org.mockito.Mockito.verifyNoMoreInteractions(events);
    }

    @Test
    void publishPendingHabitsOnlyLooksAtTheGivenUser() {
        when(repository.findByUserIdOrderByTitleAsc("u2")).thenReturn(List.of());

        assertEquals(0, service.publishPendingHabits("u2", java.time.LocalDate.of(2026, 10, 10)));
        org.mockito.Mockito.verify(repository, org.mockito.Mockito.never()).findAll();
        org.mockito.Mockito.verify(repository, org.mockito.Mockito.never()).findByUserIdOrderByTitleAsc("u1");
    }

    @Test
    void todayDependsOnTheUsersZoneNotTheServers() {
        // Para u9 ya es 11 de octubre aunque para el resto sea el 10.
        when(userZone.today("u9")).thenReturn(java.time.LocalDate.of(2026, 10, 11));
        Habit habit = habitOf("u9");
        when(repository.findById("h1")).thenReturn(Optional.of(habit));
        when(repository.save(any(Habit.class))).then(returnsFirstArg());

        Habit saved = service.updateCompletion("u9", "h1", new UpdateHabitCompletionRequest(true, null));

        assertEquals(List.of("2026-10-11"), saved.getCompletedDates());
    }

    @Test
    void statsUseTodayFromTheClockAndTheOwnedHabit() {
        Habit habit = existing();
        habit.setFrequency(HabitFrequency.DAILY);
        habit.setDaysOfWeek(List.of(1, 2, 3, 4, 5, 6, 7));
        habit.setCompletedDates(new java.util.ArrayList<>(List.of("2026-10-09", "2026-10-10")));
        when(repository.findById("h1")).thenReturn(Optional.of(habit));

        HabitStats stats = service.stats("u1", "h1", 7);

        assertEquals(2, stats.currentStreak()); // el reloj fija hoy = 2026-10-10
        assertEquals(7, stats.windowDays());
    }

    @Test
    void statsRejectOutOfRangeWindows() {
        for (int days : new int[]{0, -1, 366}) {
            assertThrows(BusinessRuleException.class, () -> service.stats("u1", "h1", days));
        }
    }

    @Test
    void statsHideHabitsOfOtherUsers() {
        when(repository.findById("h1")).thenReturn(Optional.of(habitOf("u2")));

        assertThrows(NotFoundException.class, () -> service.stats("u1", "h1", 30));
    }

    @Test
    void createStoresTheCreationDayFromTheClock() {
        when(repository.save(any(Habit.class))).then(returnsFirstArg());

        Habit created = service.create("u1", new com.app.myorbit.habits.api.CreateHabitRequest("Leer", null, null, null, null));

        assertEquals("2026-10-10", created.getCreatedDate());
    }
}
