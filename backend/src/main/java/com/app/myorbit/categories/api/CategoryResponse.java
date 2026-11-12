package com.app.myorbit.categories.api;

import com.app.myorbit.categories.domain.Category;

/** {@code parentId}: la categoría padre; null si es una categoría raíz. */
public record CategoryResponse(String id, String userId, String name, String color, String parentId) {
    public static CategoryResponse from(Category category) {
        return new CategoryResponse(category.getId(), category.getUserId(), category.getName(), category.getColor(), category.getParentId());
    }
}
