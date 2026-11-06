package com.app.myorbit.tasks.infrastructure;

import com.app.myorbit.categories.domain.Category;
import com.app.myorbit.categories.infrastructure.CategoryRepository;
import org.bson.Document;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

/**
 * Migración única: convierte el campo legado {@code tag} (texto libre, p. ej. "Personal")
 * en {@code categoryId}. Cuando la tarea tiene una categoría con ese nombre para su usuario se
 * reutiliza; si no, se crea. Las tareas sin tag quedan sin categoría. Queda marcada para no repetirse.
 */
@Component
public class TaskCategoryMigration implements ApplicationRunner {
    static final String MARKER_COLLECTION = "migrations";
    static final String MARKER_ID = "tag-as-category-id";

    private final CategoryRepository categoryRepository;
    private final MongoTemplate mongoTemplate;

    public TaskCategoryMigration(CategoryRepository categoryRepository, MongoTemplate mongoTemplate) {
        this.categoryRepository = categoryRepository;
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (mongoTemplate.getCollection(MARKER_COLLECTION).countDocuments(new Document("_id", MARKER_ID)) > 0) return;
        for (Document task : mongoTemplate.getCollection("tasks").find()) {
            String userId = task.getString("userId");
            String tag = task.getString("tag");
            if (tag == null) continue;
            if (tag.isBlank()) {
                mongoTemplate.getCollection("tasks").updateOne(
                        new Document("_id", task.get("_id")),
                        new Document("$unset", new Document("tag", "")));
                continue;
            }
            String categoryId = categoryRepository.findByUserIdAndNameIgnoreCase(userId, tag.trim())
                    .map(Category::getId)
                    .orElseGet(() -> createCategory(userId, tag.trim()));
            mongoTemplate.getCollection("tasks").updateOne(
                    new Document("_id", task.get("_id")),
                    new Document("$set", new Document("categoryId", categoryId))
                            .append("$unset", new Document("tag", "")));
        }
        mongoTemplate.getCollection(MARKER_COLLECTION).insertOne(new Document("_id", MARKER_ID).append("at", new java.util.Date()));
    }

    private String createCategory(String userId, String name) {
        Category category = new Category();
        category.setId(java.util.UUID.randomUUID().toString());
        category.setUserId(userId);
        category.setName(name);
        category.setColor("#667085");
        return categoryRepository.save(category).getId();
    }
}
