package com.app.MyOrbit.categories;

import com.app.MyOrbit.users.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/categories")
public class CategoryController {
    private final CategoryService categoryService;
    private final AuthService authService;

    public CategoryController(CategoryService categoryService, AuthService authService) {
        this.categoryService = categoryService;
        this.authService = authService;
    }

    @GetMapping
    public List<Category> list(@RequestHeader("Authorization") String authorization) {
        return categoryService.listByUser(authService.requireUser(authorization).getId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Category create(@RequestBody CreateCategoryRequest request, @RequestHeader("Authorization") String authorization) {
        return categoryService.create(authService.requireUser(authorization).getId(), request);
    }
}
