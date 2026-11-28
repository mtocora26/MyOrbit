package com.app.myorbit.users.application;

import com.app.myorbit.TestcontainersConfiguration;
import com.app.myorbit.users.domain.Role;
import com.app.myorbit.users.domain.User;
import org.bson.Document;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Contra un Mongo real: eliminar una cuenta no deja nada suyo en ninguna colección y no toca las de otros.
 * Las colecciones salen de las entidades mapeadas, así que una nueva sin borrado hace fallar este test.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@Testcontainers(disabledWithoutDocker = true)
class AccountDeletionIntegrationTest {
    private static final String VICTIM = "deletion-it-victim";
    private static final String BYSTANDER = "deletion-it-bystander";
    /** Su {@code _id} es el del usuario. */
    private static final List<String> KEYED_BY_USER = List.of("users", "user_profiles", "notification_preferences");

    @Autowired
    private UserAdminService service;
    @Autowired
    private MongoTemplate mongo;

    @AfterEach
    void cleanUp() {
        collections().forEach(collection -> List.of(VICTIM, BYSTANDER)
                .forEach(userId -> mongo.getCollection(collection).deleteMany(ownedBy(userId))));
    }

    @Test
    void shouldRemoveEveryDocumentOfTheUser_whenTheAccountIsDeleted() {
        collections().forEach(collection -> {
            seed(collection, VICTIM);
            seed(collection, BYSTANDER);
        });
        User admin = new User();
        admin.setId("deletion-it-admin");
        admin.setRole(Role.ADMIN);

        service.delete(admin, VICTIM);

        collections().forEach(collection -> {
            assertEquals(0, count(collection, VICTIM), "quedaron datos del usuario en " + collection);
            assertEquals(1, count(collection, BYSTANDER), "se borraron datos de otra cuenta en " + collection);
        });
    }

    private List<String> collections() {
        return mongo.getConverter().getMappingContext().getPersistentEntities().stream()
                .filter(entity -> entity.isAnnotationPresent(org.springframework.data.mongodb.core.mapping.Document.class))
                .map(entity -> mongo.getCollectionName(entity.getType()))
                .sorted()
                .toList();
    }

    /** Un documento mínimo, con los índices únicos (correo, dirección push) distintos por usuario. */
    private void seed(String collection, String userId) {
        Document document = new Document("_id", KEYED_BY_USER.contains(collection) ? userId : UUID.randomUUID().toString());
        if (!KEYED_BY_USER.contains(collection)) document.append("userId", userId);
        document.append("email", userId + "@example.com").append("address", userId + "-device");
        mongo.getCollection(collection).insertOne(document);
    }

    private long count(String collection, String userId) {
        return mongo.getCollection(collection).countDocuments(ownedBy(userId));
    }

    private Document ownedBy(String userId) {
        return new Document("$or", List.of(new Document("_id", userId), new Document("userId", userId)));
    }
}
