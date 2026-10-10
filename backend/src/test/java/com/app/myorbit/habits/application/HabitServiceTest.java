package com.app.myorbit.habits.application;

import com.app.myorbit.habits.domain.Habit;
import com.app.myorbit.habits.infrastructure.HabitRepository;
import com.app.myorbit.shared.error.NotFoundException;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class HabitServiceTest {
    private final HabitRepository repository = mock(HabitRepository.class);
    private final HabitService service = new HabitService(repository);

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
}
