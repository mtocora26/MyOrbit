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

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class CategoryService {
    static final int MAX_NAME = 50;
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

    /**
     * Crea la categoría, raíz o, con {@code parentId}, subcategoría de una raíz del usuario. El nombre no puede repetirse
     * entre hermanas (las que tienen el mismo padre); sí puede repetirse bajo otro padre. Sin color propio, una
     * subcategoría hereda el de su padre.
     */
    public Category create(String userId, CreateCategoryRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            throw new BusinessRuleException("El nombre de la categoria es obligatorio");
        }
        String name = request.name().trim();
        Category parent = resolveParent(userId, request.parentId(), null);
        String parentId = parent == null ? null : parent.getId();
        ensureNameFree(userId, parentId, name, null);

        Category category = new Category();
        category.setId(UUID.randomUUID().toString());
        category.setUserId(userId);
        category.setName(name);
        category.setParentId(parentId);
        String fallbackColor = parent != null ? parent.getColor() : "#667085";
        category.setColor(HEX_COLOR.matcher(request.color() == null ? "" : request.color()).matches() ? request.color() : fallbackColor);
        return categoryRepository.save(category);
    }

    /**
     * Edita nombre y color y, según {@code parentId}: ausente no cambia el padre, cadena vacía la pasa a raíz y un id la
     * mueve bajo esa raíz. Una categoría con subcategorías no puede volverse subcategoría (serían tres niveles).
     */
    public Category update(String userId, String id, UpdateCategoryRequest request) {
        Category category = getOwned(userId, id);
        String name = request.name().trim();
        String parentId = category.getParentId();
        if (request.parentId() != null) {
            Category parent = resolveParent(userId, request.parentId(), category);
            parentId = parent == null ? null : parent.getId();
        }
        ensureNameFree(userId, parentId, name, id);
        category.setName(name);
        category.setParentId(parentId);
        if (request.color() != null) category.setColor(request.color());
        return categoryRepository.save(category);
    }

    /**
     * Elimina la categoría. Sus subcategorías no se pierden: pasan a ser categorías raíz (si el nombre choca con otra
     * raíz se renombran «Padre › Hija»). Las tareas de la categoría eliminada quedan sin categoría (ver
     * {@link CategoryDeletedEvent}); las de sus subcategorías se conservan en ellas.
     */
    public void delete(String userId, String id) {
        Category category = getOwned(userId, id);
        promoteChildren(userId, category);
        categoryRepository.deleteById(category.getId());
        events.publishEvent(new CategoryDeletedEvent(userId, category.getId()));
    }

    /** El id de la categoría junto con los de sus subcategorías; para filtrar tareas por una categoría y lo que contiene. */
    public Set<String> withSubcategories(String userId, String id) {
        Set<String> ids = new HashSet<>();
        ids.add(id);
        categoryRepository.findByUserIdAndParentId(userId, id).forEach(child -> ids.add(child.getId()));
        return ids;
    }

    /** El padre indicado (null si {@code parentId} viene vacío): debe ser del usuario, una raíz y distinto de la propia categoría. */
    private Category resolveParent(String userId, String parentId, Category child) {
        if (parentId == null || parentId.isBlank()) return null;
        Category parent = getOwned(userId, parentId.trim());
        if (child != null && parent.getId().equals(child.getId())) {
            throw new BusinessRuleException("Una categoria no puede ser su propio padre");
        }
        if (!parent.isRoot()) {
            throw new BusinessRuleException("Solo se permite un nivel de subcategorias: " + parent.getName() + " ya es una subcategoria");
        }
        if (child != null && !categoryRepository.findByUserIdAndParentId(userId, child.getId()).isEmpty()) {
            throw new BusinessRuleException(child.getName() + " tiene subcategorias y no puede pasar a ser una subcategoria");
        }
        return parent;
    }

    private void ensureNameFree(String userId, String parentId, String name, String excludedId) {
        boolean taken = categoryRepository.findByUserIdOrderByNameAsc(userId).stream()
                .filter(other -> !other.getId().equals(excludedId) && Objects.equals(other.getParentId(), parentId))
                .anyMatch(other -> other.getName().equalsIgnoreCase(name));
        if (taken) {
            throw new BusinessRuleException(parentId == null ? "Ya existe una categoria con ese nombre" : "Ya existe una subcategoria con ese nombre en esa categoria");
        }
    }

    private void promoteChildren(String userId, Category parent) {
        List<Category> children = categoryRepository.findByUserIdAndParentId(userId, parent.getId());
        if (children.isEmpty()) return;
        Set<String> rootNames = new HashSet<>();
        categoryRepository.findByUserIdOrderByNameAsc(userId).stream()
                .filter(other -> other.isRoot() && !other.getId().equals(parent.getId()))
                .forEach(other -> rootNames.add(other.getName().toLowerCase(Locale.ROOT)));
        for (Category child : children) {
            String name = child.getName();
            if (rootNames.contains(name.toLowerCase(Locale.ROOT))) {
                name = freeRootName(parent.getName() + " › " + child.getName(), rootNames);
            }
            rootNames.add(name.toLowerCase(Locale.ROOT));
            child.setName(name);
            child.setParentId(null);
        }
        categoryRepository.saveAll(children);
    }

    /** Un nombre libre entre las raíces, recortado al máximo permitido y con « (2)», « (3)»... si hace falta. */
    private String freeRootName(String wanted, Set<String> rootNames) {
        String base = wanted.length() > MAX_NAME ? wanted.substring(0, MAX_NAME) : wanted;
        String candidate = base;
        for (int n = 2; rootNames.contains(candidate.toLowerCase(Locale.ROOT)); n++) {
            String suffix = " (" + n + ")";
            candidate = (base.length() + suffix.length() > MAX_NAME ? base.substring(0, MAX_NAME - suffix.length()) : base) + suffix;
        }
        return candidate;
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
