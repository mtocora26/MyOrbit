package com.app.myorbit.tasks.application;

import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.NotFoundException;
import com.app.myorbit.tasks.api.CreateSubtaskRequest;
import com.app.myorbit.tasks.api.CreateTaskRequest;
import com.app.myorbit.tasks.api.UpdateSubtaskRequest;
import com.app.myorbit.tasks.domain.Subtask;
import com.app.myorbit.tasks.api.UpdateSubtaskStatusRequest;
import com.app.myorbit.tasks.domain.Task;
import com.app.myorbit.tasks.infrastructure.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
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

    @Test
    void addSubtaskRejectsBlankTitle() {
        when(repository.findById("t1")).thenReturn(Optional.of(taskOf("u1")));

        assertThrows(BusinessRuleException.class,
                () -> service.addSubtask("u1", "t1", new CreateSubtaskRequest(" ", null)));
    }

    @Test
    void updateSubtaskStatusFailsWhenSubtaskDoesNotExist() {
        when(repository.findById("t1")).thenReturn(Optional.of(taskOf("u1")));

        assertThrows(NotFoundException.class,
                () -> service.updateSubtaskStatus("u1", "t1", "missing", new UpdateSubtaskStatusRequest(true)));
    }

    @Test
    void deleteSubtaskFailsWhenSubtaskDoesNotExist() {
        when(repository.findById("t1")).thenReturn(Optional.of(taskOf("u1")));

        assertThrows(NotFoundException.class, () -> service.deleteSubtask("u1", "t1", "missing"));
    }

    @Test
    void createRejectsBlankTitle() {
        assertThrows(BusinessRuleException.class, () -> service.create("u1", new CreateTaskRequest("   ", null, null, null)));
        assertThrows(BusinessRuleException.class, () -> service.create("u1", new CreateTaskRequest(null, null, null, null)));
        verify(repository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void createTrimsTitleAndAppliesDefaults() {
        when(repository.save(org.mockito.ArgumentMatchers.any(Task.class))).thenAnswer(call -> call.getArgument(0));

        Task task = service.create("u1", new CreateTaskRequest("  Estudiar  ", null, null, null));

        assertEquals("Estudiar", task.getTitle());
        assertEquals(com.app.myorbit.tasks.domain.Priority.MEDIUM, task.getPriority());
    }

    private Task taskWithSubtask(String due) {
        java.time.LocalDateTime parsed = due == null ? null : java.time.LocalDateTime.parse(due);
        Task task = taskOf("u1");
        Subtask subtask = new Subtask();
        subtask.setId("s1");
        subtask.setTitle("Paso");
        subtask.setDue(parsed);
        task.getSubtasks().add(subtask);
        when(repository.findById("t1")).thenReturn(Optional.of(task));
        when(repository.save(org.mockito.ArgumentMatchers.any(Task.class))).thenAnswer(call -> call.getArgument(0));
        return task;
    }

    @Test
    void updateSubtaskWithoutDueKeepsExistingDate() {
        Task task = taskWithSubtask("2026-11-01T10:00");

        service.updateSubtask("u1", "t1", "s1", new UpdateSubtaskRequest("Nuevo", null));

        assertEquals(java.time.LocalDateTime.parse("2026-11-01T10:00"), task.findSubtask("s1").orElseThrow().getDue());
        assertEquals("Nuevo", task.findSubtask("s1").orElseThrow().getTitle());
    }

    @Test
    void updateSubtaskWithBlankDueClearsDate() {
        Task task = taskWithSubtask("2026-11-01T10:00");

        service.updateSubtask("u1", "t1", "s1", new UpdateSubtaskRequest("", "  "));

        assertNull(task.findSubtask("s1").orElseThrow().getDue());
    }

    @Test
    void updateSubtaskWithDueReplacesDate() {
        Task task = taskWithSubtask("2026-11-01T10:00");

        service.updateSubtask("u1", "t1", "s1", new UpdateSubtaskRequest(null, "2026-12-05T18:30"));

        assertEquals(java.time.LocalDateTime.parse("2026-12-05T18:30"), task.findSubtask("s1").orElseThrow().getDue());
    }

    @Test
    void updateSubtaskRejectsInvalidDate() {
        taskWithSubtask(null);

        assertThrows(BusinessRuleException.class,
                () -> service.updateSubtask("u1", "t1", "s1", new UpdateSubtaskRequest(null, "Mañana")));
    }

    @Test
    void createWithoutDueLeavesNoDateAndWithDueParsesIso() {
        when(repository.save(org.mockito.ArgumentMatchers.any(Task.class))).thenAnswer(call -> call.getArgument(0));

        assertNull(service.create("u1", new CreateTaskRequest("A", null, null, null)).getDue());
        assertEquals(java.time.LocalDateTime.parse("2026-10-10T23:59"),
                service.create("u1", new CreateTaskRequest("B", "2026-10-10T23:59", null, null)).getDue());
        assertThrows(BusinessRuleException.class, () -> service.create("u1", new CreateTaskRequest("C", "Sin fecha", null, null)));
    }

    @Test
    void updateKeepsClearsOrReplacesTheDate() {
        Task task = taskOf("u1");
        task.setDue(java.time.LocalDateTime.parse("2026-10-10T08:00"));
        when(repository.findById("t1")).thenReturn(Optional.of(task));
        when(repository.save(org.mockito.ArgumentMatchers.any(Task.class))).thenAnswer(call -> call.getArgument(0));

        service.update("u1", "t1", new com.app.myorbit.tasks.api.UpdateTaskRequest("Nuevo", null, null, null));
        assertEquals(java.time.LocalDateTime.parse("2026-10-10T08:00"), task.getDue());
        service.update("u1", "t1", new com.app.myorbit.tasks.api.UpdateTaskRequest(null, "2026-11-02T09:15", null, null));
        assertEquals(java.time.LocalDateTime.parse("2026-11-02T09:15"), task.getDue());
        service.update("u1", "t1", new com.app.myorbit.tasks.api.UpdateTaskRequest(null, "", null, null));
        assertNull(task.getDue());
    }

    @Test
    void listIsOrderedByDueDateWithUndatedTasksLast() {
        Task late = taskOf("u1");
        late.setId("a");
        late.setDue(java.time.LocalDateTime.parse("2026-12-01T10:00"));
        Task undated = taskOf("u1");
        undated.setId("b");
        Task soon = taskOf("u1");
        soon.setId("c");
        soon.setDue(java.time.LocalDateTime.parse("2026-10-01T10:00"));
        when(repository.findByUserIdOrderByIdAsc("u1")).thenReturn(java.util.List.of(late, undated, soon));

        assertEquals(java.util.List.of("c", "a", "b"), service.listByUser("u1").stream().map(Task::getId).toList());
    }
}
