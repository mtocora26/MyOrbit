package com.app.myorbit.tasks.application;

import com.app.myorbit.categories.application.CategoryService;
import com.app.myorbit.categories.domain.Category;
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
    private CategoryService categoryService;
    private TaskService service;

    @BeforeEach
    void setUp() {
        repository = mock(TaskRepository.class);
        categoryService = mock(CategoryService.class);
        service = new TaskService(repository, categoryService);
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

    private Task taskWith(String id, boolean done, String due, com.app.myorbit.tasks.domain.Priority priority, String categoryId) {
        Task task = taskOf("u1");
        task.setId(id);
        task.setDone(done);
        task.setDue(due == null ? null : java.time.LocalDateTime.parse(due));
        task.setPriority(priority);
        task.setCategoryId(categoryId);
        return task;
    }

    @Test
    void listFiltersByDonePriorityCategoryAndDateRange() {
        Task pendingHigh = taskWith("a", false, "2026-10-10T10:00", com.app.myorbit.tasks.domain.Priority.HIGH, "c1");
        Task doneHigh = taskWith("b", true, "2026-10-10T11:00", com.app.myorbit.tasks.domain.Priority.HIGH, "c1");
        Task pendingLow = taskWith("c", false, "2026-12-01T10:00", com.app.myorbit.tasks.domain.Priority.LOW, "c2");
        Task undated = taskWith("d", false, null, com.app.myorbit.tasks.domain.Priority.HIGH, null);
        when(repository.findByUserIdOrderByIdAsc("u1")).thenReturn(java.util.List.of(doneHigh, undated, pendingLow, pendingHigh));

        assertEquals(java.util.List.of("b"),
                service.listByUser("u1", new TaskFilter(true, null, null, null, null, false)).stream().map(Task::getId).toList());
        assertEquals(java.util.List.of("a", "b", "d"),
                service.listByUser("u1", new TaskFilter(null, null, null, com.app.myorbit.tasks.domain.Priority.HIGH, null, false)).stream().map(Task::getId).toList());
        assertEquals(java.util.List.of("a", "b"),
                service.listByUser("u1", new TaskFilter(null, null, null, null, "c1", false)).stream().map(Task::getId).toList());
        assertEquals(java.util.List.of("d"),
                service.listByUser("u1", new TaskFilter(null, null, null, null, null, true)).stream().map(Task::getId).toList());
        assertEquals(java.util.List.of("a", "b"),
                service.listByUser("u1", new TaskFilter(null,
                        java.time.LocalDateTime.parse("2026-10-01T00:00"),
                        java.time.LocalDateTime.parse("2026-10-31T23:59"), null, null, false)).stream().map(Task::getId).toList());
        assertEquals(java.util.List.of("a"),
                service.listByUser("u1", new TaskFilter(false,
                        java.time.LocalDateTime.parse("2026-10-01T00:00"),
                        java.time.LocalDateTime.parse("2026-10-31T23:59"), com.app.myorbit.tasks.domain.Priority.HIGH, "c1", false)).stream().map(Task::getId).toList());
    }

    @Test
    void listRejectsInvertedDateRange() {
        assertThrows(BusinessRuleException.class, () -> service.listByUser("u1", new TaskFilter(null,
                java.time.LocalDateTime.parse("2026-12-01T00:00"),
                java.time.LocalDateTime.parse("2026-10-01T00:00"), null, null, false)));
    }

    private Category categoryOf(String userId, String id) {
        Category category = new Category();
        category.setId(id);
        category.setUserId(userId);
        category.setName("Personal");
        return category;
    }

    @Test
    void createWithoutCategoryLeavesNoCategory() {
        when(repository.save(org.mockito.ArgumentMatchers.any(Task.class))).thenAnswer(call -> call.getArgument(0));

        assertNull(service.create("u1", new CreateTaskRequest("A", null, null, null)).getCategoryId());
        assertNull(service.create("u1", new CreateTaskRequest("B", null, null, "  ")).getCategoryId());
    }

    @Test
    void createWithCategoryValidatesOwnership() {
        when(repository.save(org.mockito.ArgumentMatchers.any(Task.class))).thenAnswer(call -> call.getArgument(0));
        when(categoryService.getOwned("u1", "c1")).thenReturn(categoryOf("u1", "c1"));

        Task task = service.create("u1", new CreateTaskRequest("A", null, null, "c1"));

        assertEquals("c1", task.getCategoryId());
    }

    @Test
    void createWithUnknownCategoryIsNotFound() {
        when(categoryService.getOwned("u1", "missing"))
                .thenThrow(new NotFoundException("Categoría no encontrada"));

        assertThrows(NotFoundException.class, () -> service.create("u1", new CreateTaskRequest("A", null, null, "missing")));
        verify(repository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void updateKeepsClearsOrReplacesCategory() {
        Task task = taskOf("u1");
        task.setCategoryId("c1");
        when(repository.findById("t1")).thenReturn(Optional.of(task));
        when(repository.save(org.mockito.ArgumentMatchers.any(Task.class))).thenAnswer(call -> call.getArgument(0));
        when(categoryService.getOwned("u1", "c2")).thenReturn(categoryOf("u1", "c2"));

        service.update("u1", "t1", new com.app.myorbit.tasks.api.UpdateTaskRequest(null, null, null, null));
        assertEquals("c1", task.getCategoryId());
        service.update("u1", "t1", new com.app.myorbit.tasks.api.UpdateTaskRequest(null, null, null, "c2"));
        assertEquals("c2", task.getCategoryId());
        service.update("u1", "t1", new com.app.myorbit.tasks.api.UpdateTaskRequest(null, null, null, ""));
        assertNull(task.getCategoryId());
    }

    @Test
    void updateWithUnknownCategoryIsNotFound() {
        Task task = taskOf("u1");
        when(repository.findById("t1")).thenReturn(Optional.of(task));
        when(categoryService.getOwned("u1", "missing"))
                .thenThrow(new NotFoundException("Categoría no encontrada"));

        assertThrows(NotFoundException.class,
                () -> service.update("u1", "t1", new com.app.myorbit.tasks.api.UpdateTaskRequest(null, null, null, "missing")));
    }
}
