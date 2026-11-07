package com.app.myorbit.categories.application;

import com.app.myorbit.categories.api.UpdateCategoryRequest;
import com.app.myorbit.categories.domain.Category;
import com.app.myorbit.categories.domain.CategoryDeletedEvent;
import com.app.myorbit.categories.infrastructure.CategoryRepository;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CategoryServiceTest {
    private CategoryRepository repository;
    private ApplicationEventPublisher events;
    private CategoryService service;

    @BeforeEach
    void setUp() {
        repository = mock(CategoryRepository.class);
        events = mock(ApplicationEventPublisher.class);
        service = new CategoryService(repository, events);
    }

    private Category categoryOf(String userId) {
        Category category = new Category();
        category.setId("c1");
        category.setUserId(userId);
        category.setName("Personal");
        return category;
    }

    @Test
    void getOwnedReturnsCategoryOfTheUser() {
        Category category = categoryOf("u1");
        when(repository.findById("c1")).thenReturn(Optional.of(category));

        assertSame(category, service.getOwned("u1", "c1"));
    }

    @Test
    void getOwnedHidesCategoriesOfOtherUsers() {
        when(repository.findById("c1")).thenReturn(Optional.of(categoryOf("u2")));

        assertThrows(NotFoundException.class, () -> service.getOwned("u1", "c1"));
    }

    @Test
    void getOwnedFailsWhenCategoryDoesNotExist() {
        when(repository.findById("missing")).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.getOwned("u1", "missing"));
    }

    private Category named(String id, String userId, String name) {
        Category category = categoryOf(userId);
        category.setId(id);
        category.setName(name);
        category.setColor("#12B76A");
        return category;
    }

    @Test
    void updateChangesNameAndColor() {
        Category category = named("c1", "u1", "Personal");
        when(repository.findById("c1")).thenReturn(Optional.of(category));
        when(repository.findByUserIdOrderByNameAsc("u1")).thenReturn(List.of(category));
        when(repository.save(any(Category.class))).thenAnswer(inv -> inv.getArgument(0));

        Category updated = service.update("u1", "c1", new UpdateCategoryRequest("  Gym ", "#2E90FA"));

        assertEquals("Gym", updated.getName());
        assertEquals("#2E90FA", updated.getColor());
    }

    @Test
    void updateKeepsColorWhenNotProvidedAndAllowsSameName() {
        Category category = named("c1", "u1", "Personal");
        when(repository.findById("c1")).thenReturn(Optional.of(category));
        when(repository.findByUserIdOrderByNameAsc("u1")).thenReturn(List.of(category));
        when(repository.save(any(Category.class))).thenAnswer(inv -> inv.getArgument(0));

        Category updated = service.update("u1", "c1", new UpdateCategoryRequest("personal", null));

        assertEquals("personal", updated.getName());
        assertEquals("#12B76A", updated.getColor());
    }

    @Test
    void updateRejectsNameUsedByAnotherCategory() {
        Category category = named("c1", "u1", "Personal");
        Category other = named("c2", "u1", "Proyecto");
        when(repository.findById("c1")).thenReturn(Optional.of(category));
        when(repository.findByUserIdOrderByNameAsc("u1")).thenReturn(List.of(category, other));

        assertThrows(BusinessRuleException.class, () -> service.update("u1", "c1", new UpdateCategoryRequest("proyecto", null)));
        verify(repository, never()).save(any());
    }

    @Test
    void updateHidesCategoriesOfOtherUsers() {
        when(repository.findById("c1")).thenReturn(Optional.of(categoryOf("u2")));

        assertThrows(NotFoundException.class, () -> service.update("u1", "c1", new UpdateCategoryRequest("X", null)));
    }

    @Test
    void deleteRemovesCategoryAndPublishesEvent() {
        when(repository.findById("c1")).thenReturn(Optional.of(categoryOf("u1")));

        service.delete("u1", "c1");

        verify(repository).deleteById("c1");
        verify(events).publishEvent(new CategoryDeletedEvent("u1", "c1"));
    }

    @Test
    void deleteDoesNotTouchCategoriesOfOtherUsers() {
        when(repository.findById("c1")).thenReturn(Optional.of(categoryOf("u2")));

        assertThrows(NotFoundException.class, () -> service.delete("u1", "c1"));
        verify(repository, never()).deleteById(any());
        verify(events, never()).publishEvent(any(Object.class));
    }
}
