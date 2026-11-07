package com.app.myorbit.categories.application;

import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.NotFoundException;
import com.app.myorbit.categories.api.CreateCategoryRequest;
import com.app.myorbit.categories.api.UpdateCategoryRequest;
import com.app.myorbit.categories.domain.Category;
import com.app.myorbit.categories.domain.CategoryDeletedEvent;
import com.app.myorbit.categories.infrastructure.CategoryRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class CategoryService {
    private static final Pattern HEX_COLOR = Pattern.compile("^#[0-9a-fA-F]{6}$");
    private final CategoryRepository categoryRepository;
    private final ApplicationEventPublisher events;

    public CategoryService(CategoryRepository categoryRepository, ApplicationEventPublisher events) {
        this.categoryRepository = categoryRepository;
        this.events = events;
    }

    public List<Category> listByUser(String userId) {
        List<Category> categories = categoryRepository.findByUserIdOrderByNameAsc(userId);
        if (categories.isEmpty()) {
            categories = seedDefaults(userId);
        }
        return categories;
    }

    public Category getOwned(String userId, String id) {
        return categoryRepository.findById(id)
                .filter(category -> category.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("Categoría no encontrada"));
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

    public Category update(String userId, String id, UpdateCategoryRequest request) {
        Category category = getOwned(userId, id);
        String name = request.name().trim();
        boolean taken = categoryRepository.findByUserIdOrderByNameAsc(userId).stream()
                .anyMatch(other -> !other.getId().equals(id) && other.getName().equalsIgnoreCase(name));
        if (taken) {
            throw new BusinessRuleException("Ya existe una categoria con ese nombre");
        }
        category.setName(name);
        if (request.color() != null) category.setColor(request.color());
        return categoryRepository.save(category);
    }

    /** Elimina la categoría; las tareas que la usaban quedan sin categoría (ver {@link CategoryDeletedEvent}). */
    public void delete(String userId, String id) {
        Category category = getOwned(userId, id);
        categoryRepository.deleteById(category.getId());
        events.publishEvent(new CategoryDeletedEvent(userId, category.getId()));
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
