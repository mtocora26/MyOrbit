package com.app.myorbit.notifications.infrastructure;

import com.app.myorbit.TestcontainersConfiguration;
import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** Verifica contra un Mongo real que un aviso de tipo retirado ya no rompe el listado. */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@Testcontainers(disabledWithoutDocker = true)
class LegacyNotificationTypeMigrationTest {
    @Autowired
    private MongoTemplate mongoTemplate;
    @Autowired
    private NotificationRepository repository;
    @Autowired
    private LegacyNotificationTypeMigration migration;

    @Test
    void removesNoticesWithRetiredTypesAndKeepsTheRest() {
        var collection = mongoTemplate.getCollection("notifications");
        collection.insertOne(new Document("_id", "legacy-event").append("userId", "legacy-u").append("type", "EVENT").append("read", false));
        collection.insertOne(new Document("_id", "legacy-habit").append("userId", "legacy-u").append("type", "HABIT").append("read", false));

        migration.run(new DefaultApplicationArguments());

        assertEquals(1, repository.findByUserIdOrderByCreatedAtDesc("legacy-u").size());
        repository.deleteById("legacy-habit");
    }
}
