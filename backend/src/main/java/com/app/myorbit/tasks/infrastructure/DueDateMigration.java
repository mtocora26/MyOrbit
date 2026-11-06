package com.app.myorbit.tasks.infrastructure;

import org.bson.Document;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

/**
 * Migración única: lee las tareas (el conversor tolera las fechas antiguas en texto) y las vuelve a guardar
 * para que `due` quede como fecha real en cada tarea y subtarea. Queda marcada para no repetirse.
 */
@Component
public class DueDateMigration implements ApplicationRunner {
    static final String MARKER_COLLECTION = "migrations";
    static final String MARKER_ID = "due-as-datetime";

    private final TaskRepository taskRepository;
    private final MongoTemplate mongoTemplate;

    public DueDateMigration(TaskRepository taskRepository, MongoTemplate mongoTemplate) {
        this.taskRepository = taskRepository;
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (mongoTemplate.getCollection(MARKER_COLLECTION).countDocuments(new Document("_id", MARKER_ID)) > 0) return;
        taskRepository.saveAll(taskRepository.findAll());
        mongoTemplate.getCollection(MARKER_COLLECTION).insertOne(new Document("_id", MARKER_ID).append("at", new java.util.Date()));
    }
}
