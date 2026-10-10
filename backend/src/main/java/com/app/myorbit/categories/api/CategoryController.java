package com.app.myorbit.categories.api;

import com.app.myorbit.categories.application.CategoryService;
import com.app.myorbit.categories.domain.Category;
import com.app.myorbit.users.api.CurrentUser;
import com.app.myorbit.users.domain.User;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/categories")
public class CategoryController {
    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public List<Category> list(@CurrentUser User user) {
        return categoryService.listByUser(user.getId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Category create(@RequestBody CreateCategoryRequest request, @CurrentUser User user) {
        return categoryService.create(user.getId(), request);
    }
}
