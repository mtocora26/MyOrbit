package com.app.myorbit.habits.application;

import com.app.myorbit.habits.api.UpdateHabitCompletionRequest;
import com.app.myorbit.habits.api.UpdateHabitRequest;
import com.app.myorbit.habits.domain.HabitFrequency;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.habits.domain.Habit;
import com.app.myorbit.habits.infrastructure.HabitRepository;
import com.app.myorbit.shared.error.NotFoundException;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
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
    private final HabitService service = new HabitService(repository, Clock.fixed(Instant.parse("2026-10-10T12:00:00Z"), ZoneOffset.UTC));

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
}
