package com.app.myorbit.tasks.infrastructure;

import com.app.myorbit.TestcontainersConfiguration;
import com.app.myorbit.tasks.domain.Task;
import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/** Verifica contra un Mongo real que las fechas en texto se convierten en fechas reales. */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@Testcontainers(disabledWithoutDocker = true)
class DueDateMigrationTest {
    @Autowired
    private MongoTemplate mongoTemplate;
    @Autowired
    private TaskRepository taskRepository;
    @Autowired
    private DueDateMigration migration;

    @Test
    void convertsTextDatesInTasksAndNestedSubtasks() {
        mongoTemplate.getCollection("migrations").deleteMany(new Document());
        mongoTemplate.getCollection("tasks").insertOne(new Document("_id", "legacy").append("userId", "u1").append("due", "2026-10-10T23:59")
                .append("subtasks", List.of(new Document("_id", "s1").append("due", "Sin fecha")
                        .append("subtasks", List.of(new Document("_id", "s2").append("due", "2026-11-01T08:00"))))));

        migration.run(new DefaultApplicationArguments());

        Document stored = mongoTemplate.getCollection("tasks").find(new Document("_id", "legacy")).first();
        assertEquals(Date.class, stored.get("due").getClass());
        Task task = taskRepository.findById("legacy").orElseThrow();
        assertEquals(LocalDateTime.parse("2026-10-10T23:59"), task.getDue());
        assertNull(task.getSubtasks().get(0).getDue());
        assertEquals(LocalDateTime.parse("2026-11-01T08:00"), task.getSubtasks().get(0).getSubtasks().get(0).getDue());
        taskRepository.deleteById("legacy");
    }
}
