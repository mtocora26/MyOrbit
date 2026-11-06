package com.app.myorbit.categories.application;

import com.app.myorbit.categories.domain.Category;
import com.app.myorbit.categories.infrastructure.CategoryRepository;
import com.app.myorbit.shared.error.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CategoryServiceTest {
    private CategoryRepository repository;
    private CategoryService service;

    @BeforeEach
    void setUp() {
        repository = mock(CategoryRepository.class);
        service = new CategoryService(repository);
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
}
