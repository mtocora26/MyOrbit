package com.app.myorbit.tasks.application;

import com.app.myorbit.shared.error.NotFoundException;
import com.app.myorbit.tasks.domain.Task;
import com.app.myorbit.tasks.infrastructure.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TaskServiceTest {
    private TaskRepository repository;
    private TaskService service;

    @BeforeEach
    void setUp() {
        repository = mock(TaskRepository.class);
        when(repository.count()).thenReturn(1L);
        service = new TaskService(repository);
    }

    private Task taskOf(String userId) {
        Task task = new Task();
        task.setId("t1");
        task.setUserId(userId);
        return task;
    }

    @Test
    void getOwnedReturnsTaskOfTheUser() {
        Task task = taskOf("u1");
        when(repository.findById("t1")).thenReturn(Optional.of(task));

        assertSame(task, service.getOwned("u1", "t1"));
    }

    @Test
    void getOwnedHidesTasksOfOtherUsers() {
        when(repository.findById("t1")).thenReturn(Optional.of(taskOf("u2")));

        assertThrows(NotFoundException.class, () -> service.getOwned("u1", "t1"));
    }

    @Test
    void getOwnedFailsWhenTaskDoesNotExist() {
        when(repository.findById("t1")).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.getOwned("u1", "t1"));
    }

    @Test
    void deleteDoesNotRemoveTasksOfOtherUsers() {
        when(repository.findById("t1")).thenReturn(Optional.of(taskOf("u2")));

        assertThrows(NotFoundException.class, () -> service.delete("u1", "t1"));
        verify(repository, never()).deleteById(anyString());
    }
}
