package com.app.myorbit.tasks.application;

import com.app.myorbit.categories.application.CategoryService;
import com.app.myorbit.tasks.domain.Task;
import com.app.myorbit.tasks.infrastructure.TaskRepository;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TaskFilterSubcategoriesTest {
    private Task task(String id, String categoryId) {
        Task task = new Task();
        task.setId(id);
        task.setUserId("u1");
        task.setTitle("T " + id);
        task.setCategoryId(categoryId);
        return task;
    }

    @Test
    void aCategoryFilterAcceptsTheCategoryAndItsSubcategories() {
        TaskFilter filter = new TaskFilter(null, null, null, null, "uni", false);
        Set<String> accepted = Set.of("uni", "sem");

        assertTrue(filter.matches(task("1", "uni"), accepted));
        assertTrue(filter.matches(task("2", "sem"), accepted));
        assertFalse(filter.matches(task("3", "per"), accepted));
        assertFalse(filter.matches(task("4", null), accepted));
    }

    @Test
    void withoutExpansionItStillMatchesTheExactCategory() {
        TaskFilter filter = new TaskFilter(null, null, null, null, "uni", false);

        assertTrue(filter.matches(task("1", "uni")));
        assertFalse(filter.matches(task("2", "sem")));
        assertTrue(filter.matches(task("3", "uni"), Set.of()), "una expansión vacía no cambia el comportamiento");
        assertFalse(filter.matches(task("4", "sem"), Set.of()));
    }

    @Test
    void serviceListingByAParentIncludesTheTasksOfItsSubcategories() {
        TaskRepository repository = mock(TaskRepository.class);
        CategoryService categories = mock(CategoryService.class);
        TaskService service = new TaskService(repository, categories, mock(ApplicationEventPublisher.class));
        when(repository.findByUserIdOrderByIdAsc("u1")).thenReturn(List.of(task("1", "uni"), task("2", "sem"), task("3", "per"), task("4", null)));
        when(categories.withSubcategories("u1", "uni")).thenReturn(Set.of("uni", "sem"));

        List<Task> filtered = service.listByUser("u1", new TaskFilter(null, null, null, null, "uni", false));

        assertEquals(List.of("1", "2"), filtered.stream().map(Task::getId).sorted().toList());
        // Sin filtro de categoría no se consulta la jerarquía.
        assertEquals(4, service.listByUser("u1", TaskFilter.empty()).size());
    }
}
