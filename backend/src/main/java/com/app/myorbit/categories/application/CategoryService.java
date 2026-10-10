package com.app.myorbit.categories.application;

import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.categories.api.CreateCategoryRequest;
import com.app.myorbit.categories.domain.Category;
import com.app.myorbit.categories.infrastructure.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class CategoryService {
    private static final Pattern HEX_COLOR = Pattern.compile("^#[0-9a-fA-F]{6}$");
    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<Category> listByUser(String userId) {
        List<Category> categories = categoryRepository.findByUserIdOrderByNameAsc(userId);
        if (categories.isEmpty()) {
            categories = seedDefaults(userId);
        }
        return categories;
    }

    public Category create(String userId, CreateCategoryRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            throw new BusinessRuleException("El nombre de la categoria es obligatorio");
        }
        String name = request.name().trim();
        boolean exists = categoryRepository.findByUserIdOrderByNameAsc(userId).stream()
                .anyMatch(category -> category.getName().equalsIgnoreCase(name));
        if (exists) {
            throw new BusinessRuleException("Ya existe una categoria con ese nombre");
        }

        Category category = new Category();
        category.setId(UUID.randomUUID().toString());
        category.setUserId(userId);
        category.setName(name);
        category.setColor(HEX_COLOR.matcher(request.color() == null ? "" : request.color()).matches() ? request.color() : "#667085");
        return categoryRepository.save(category);
    }

    private List<Category> seedDefaults(String userId) {
        Category personal = new Category();
        personal.setId(UUID.randomUUID().toString());
        personal.setUserId(userId);
        personal.setName("Personal");
        personal.setColor("#12B76A");

        Category proyecto = new Category();
        proyecto.setId(UUID.randomUUID().toString());
        proyecto.setUserId(userId);
        proyecto.setName("Proyecto");
        proyecto.setColor("#2E90FA");

        Category universidad = new Category();
        universidad.setId(UUID.randomUUID().toString());
        universidad.setUserId(userId);
        universidad.setName("Universidad");
        universidad.setColor("#7A5AF8");

        return categoryRepository.saveAll(List.of(personal, proyecto, universidad));
    }
}
