package com.app.myorbit.tasks.application;

import com.app.myorbit.academic.application.SubjectService;
import com.app.myorbit.academic.domain.Subject;
import com.app.myorbit.academic.domain.SubjectDeletedEvent;
import com.app.myorbit.categories.application.CategoryService;
import com.app.myorbit.categories.domain.Category;
import com.app.myorbit.shared.error.NotFoundException;
import com.app.myorbit.tasks.api.CreateTaskRequest;
import com.app.myorbit.tasks.api.UpdateTaskRequest;
import com.app.myorbit.tasks.domain.Task;
import com.app.myorbit.tasks.infrastructure.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TaskSubjectTest {
    private final TaskRepository repository = mock(TaskRepository.class);
    private final CategoryService categories = mock(CategoryService.class);
    private final SubjectService subjects = mock(SubjectService.class);
    private final TaskService service = new TaskService(repository, categories, subjects, mock(ApplicationEventPublisher.class));

    @BeforeEach
    void setUp() {
        when(repository.save(any(Task.class))).then(returnsFirstArg());
        when(subjects.getOwned("u1", "redes")).thenReturn(subject("redes"));
        when(subjects.getOwned("u1", "ajena")).thenThrow(new NotFoundException("Materia no encontrada"));
        when(categories.findRootByName("u1", "Universidad")).thenReturn(Optional.of(category("uni", "Universidad")));
        when(categories.getOwned("u1", "per")).thenReturn(category("per", "Personal"));
    }

    private Subject subject(String id) {
        Subject subject = new Subject();
        subject.setId(id);
        subject.setUserId("u1");
        subject.update("Redes", 3, "2026-1", "#2E90FA");
        return subject;
    }

    private Category category(String id, String name) {
        Category category = new Category();
        category.setId(id);
        category.setUserId("u1");
        category.setName(name);
        return category;
    }

    private Task task(String id, String subjectId, String categoryId) {
        Task task = new Task();
        task.setId(id);
        task.setUserId("u1");
        task.setTitle("T " + id);
        task.setSubjectId(subjectId);
        task.setCategoryId(categoryId);
        return task;
    }

    // ---------- crear ----------

    @Test
    void createLinksTheSubjectAndDefaultsTheCategoryToUniversity() {
        Task created = service.create("u1", new CreateTaskRequest("Taller 1", null, null, null, "redes"));

        assertEquals("redes", created.getSubjectId());
        assertEquals("uni", created.getCategoryId());
    }

    @Test
    void anExplicitCategoryWinsOverTheUniversityDefault() {
        Task created = service.create("u1", new CreateTaskRequest("Taller 1", null, null, "per", "redes"));

        assertEquals("redes", created.getSubjectId());
        assertEquals("per", created.getCategoryId());
    }

    @Test
    void withoutAUniversityCategoryTheTaskStaysUncategorized() {
        when(categories.findRootByName("u1", "Universidad")).thenReturn(Optional.empty());

        Task created = service.create("u1", new CreateTaskRequest("Taller 1", null, null, null, "redes"));

        assertEquals("redes", created.getSubjectId());
        assertNull(created.getCategoryId());
    }

    @Test
    void createWithoutSubjectLeavesBothEmptyAsBefore() {
        Task created = service.create("u1", new CreateTaskRequest("Comprar pan", null, null, null));
        Task blank = service.create("u1", new CreateTaskRequest("Comprar pan", null, null, null, "  "));

        assertNull(created.getSubjectId());
        assertNull(created.getCategoryId());
        assertNull(blank.getSubjectId());
        assertNull(blank.getCategoryId());
        verify(categories, never()).findRootByName(anyString(), anyString());
    }

    @Test
    void aSubjectOfAnotherUserOrMissingIsNotFoundAndNothingIsSaved() {
        assertThrows(NotFoundException.class, () -> service.create("u1", new CreateTaskRequest("Taller 1", null, null, null, "ajena")));
        verify(repository, never()).save(any());
    }

    // ---------- editar ----------

    @Test
    void updateWithoutSubjectIdKeepsTheLink() {
        Task existing = task("t1", "redes", "uni");
        when(repository.findById("t1")).thenReturn(Optional.of(existing));

        Task updated = service.update("u1", "t1", new UpdateTaskRequest("Nuevo título", null, null, null));

        assertEquals("redes", updated.getSubjectId());
        assertEquals("uni", updated.getCategoryId());
    }

    @Test
    void updateWithEmptySubjectIdRemovesTheLinkButKeepsTheCategory() {
        Task existing = task("t1", "redes", "uni");
        when(repository.findById("t1")).thenReturn(Optional.of(existing));

        Task updated = service.update("u1", "t1", new UpdateTaskRequest(null, null, null, null, ""));

        assertNull(updated.getSubjectId());
        assertEquals("uni", updated.getCategoryId());
    }

    @Test
    void updateLinkingASubjectToAnUncategorizedTaskPutsItInUniversity() {
        Task existing = task("t1", null, null);
        when(repository.findById("t1")).thenReturn(Optional.of(existing));

        Task updated = service.update("u1", "t1", new UpdateTaskRequest(null, null, null, null, "redes"));

        assertEquals("redes", updated.getSubjectId());
        assertEquals("uni", updated.getCategoryId());
    }

    @Test
    void updateLinkingASubjectKeepsAnExistingCategory() {
        Task existing = task("t1", null, "per");
        when(repository.findById("t1")).thenReturn(Optional.of(existing));

        Task updated = service.update("u1", "t1", new UpdateTaskRequest(null, null, null, null, "redes"));

        assertEquals("redes", updated.getSubjectId());
        assertEquals("per", updated.getCategoryId());
    }

    @Test
    void updateWithAForeignSubjectIsNotFoundAndKeepsTheOldLink() {
        Task existing = task("t1", "redes", "uni");
        when(repository.findById("t1")).thenReturn(Optional.of(existing));

        assertThrows(NotFoundException.class, () -> service.update("u1", "t1", new UpdateTaskRequest(null, null, null, null, "ajena")));
        verify(repository, never()).save(any());
        assertEquals("redes", existing.getSubjectId());
    }

    // ---------- eliminar la materia ----------

    @Test
    void deletingASubjectUnlinksItsTasksButKeepsThem() {
        Task first = task("t1", "redes", "uni");
        Task second = task("t2", "redes", "uni");
        when(repository.findByUserIdAndSubjectId("u1", "redes")).thenReturn(List.of(first, second));

        service.onSubjectDeleted(new SubjectDeletedEvent("u1", "redes"));

        assertNull(first.getSubjectId());
        assertNull(second.getSubjectId());
        assertEquals("uni", first.getCategoryId());
        verify(repository).saveAll(List.of(first, second));
    }

    @Test
    void deletingASubjectWithoutTasksSavesNothing() {
        when(repository.findByUserIdAndSubjectId("u1", "redes")).thenReturn(List.of());

        service.onSubjectDeleted(new SubjectDeletedEvent("u1", "redes"));

        verify(repository, never()).saveAll(anyIterable());
    }

    // ---------- filtro ----------

    @Test
    void listFilteredBySubjectReturnsOnlyItsTasks() {
        when(repository.findByUserIdOrderByIdAsc("u1")).thenReturn(List.of(task("1", "redes", "uni"), task("2", "calculo", "uni"), task("3", null, null)));

        List<Task> tasks = service.listByUser("u1", new TaskFilter(null, null, null, null, null, false, "redes"));

        assertEquals(List.of("1"), tasks.stream().map(Task::getId).toList());
        assertEquals(3, service.listByUser("u1", TaskFilter.empty()).size());
        assertTrue(service.listByUser("u1", new TaskFilter(null, null, null, null, null, false, "nada")).isEmpty());
        assertFalse(service.listByUser("u1", new TaskFilter(null, null, null, null, null, false, "  ")).isEmpty());
    }
}
