package com.app.myorbit.categories.api;

import com.app.myorbit.categories.domain.Category;

public record CategoryResponse(String id, String userId, String name, String color) {
    public static CategoryResponse from(Category category) {
        return new CategoryResponse(category.getId(), category.getUserId(), category.getName(), category.getColor());
    }
}
