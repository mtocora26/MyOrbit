package com.app.myorbit.tasks.infrastructure;

import com.app.myorbit.TestcontainersConfiguration;
import com.app.myorbit.categories.domain.Category;
import com.app.myorbit.categories.infrastructure.CategoryRepository;
import com.app.myorbit.tasks.domain.Task;
import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/** Verifica contra un Mongo real que el tag libre se convierte en categoryId. */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@Testcontainers(disabledWithoutDocker = true)
class TaskCategoryMigrationTest {
    @Autowired
    private MongoTemplate mongoTemplate;
    @Autowired
    private TaskRepository taskRepository;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private TaskCategoryMigration migration;

    @Test
    void mapsTagToExistingCategoryByName() {
        mongoTemplate.getCollection("migrations").deleteMany(new Document());
        Category category = new Category();
        category.setId("cat-uni");
        category.setUserId("u1");
        category.setName("Universidad");
        category.setColor("#7A5AF8");
        categoryRepository.save(category);
        mongoTemplate.getCollection("tasks").insertOne(new Document("_id", "legacy-known")
                .append("userId", "u1").append("title", "A").append("tag", "Universidad").append("subtasks", List.of()));

        migration.run(new DefaultApplicationArguments());

        Document stored = mongoTemplate.getCollection("tasks").find(new Document("_id", "legacy-known")).first();
        assertEquals("cat-uni", stored.getString("categoryId"));
        assertNull(stored.getString("tag"));
        assertEquals("cat-uni", taskRepository.findById("legacy-known").orElseThrow().getCategoryId());
        taskRepository.deleteById("legacy-known");
    }

    @Test
    void createsCategoryWhenTagIsUnknown() {
        mongoTemplate.getCollection("migrations").deleteMany(new Document());
        mongoTemplate.getCollection("tasks").insertOne(new Document("_id", "legacy-new")
                .append("userId", "u1").append("title", "B").append("tag", "Salud").append("subtasks", List.of()));

        migration.run(new DefaultApplicationArguments());

        Task task = taskRepository.findById("legacy-new").orElseThrow();
        assertEquals("Salud", categoryRepository.findById(task.getCategoryId()).orElseThrow().getName());
        taskRepository.deleteById("legacy-new");
        categoryRepository.deleteById(task.getCategoryId());
    }

    @Test
    void blankTagLeavesNoCategory() {
        mongoTemplate.getCollection("migrations").deleteMany(new Document());
        mongoTemplate.getCollection("tasks").insertOne(new Document("_id", "legacy-blank")
                .append("userId", "u1").append("title", "C").append("tag", "  ").append("subtasks", List.of()));

        migration.run(new DefaultApplicationArguments());

        assertNull(taskRepository.findById("legacy-blank").orElseThrow().getCategoryId());
        mongoTemplate.getCollection("tasks").deleteOne(new Document("_id", "legacy-blank"));
    }
}
