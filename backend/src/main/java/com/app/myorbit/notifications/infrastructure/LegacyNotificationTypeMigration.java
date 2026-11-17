package com.app.myorbit.notifications.infrastructure;

import com.app.myorbit.notifications.domain.NotificationType;
import org.bson.Document;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import java.util.Arrays;

/**
 * Elimina los avisos con un tipo que ya no existe (p. ej. {@code EVENT}, «tarea completada»). Spring Data no
 * puede leerlos y hacen fallar con 500 el listado completo de la bandeja. Es idempotente: no encuentra nada
 * cuando la base ya está limpia, así que corre en cada arranque sin marca.
 */
@Component
public class LegacyNotificationTypeMigration implements ApplicationRunner {
    private final MongoTemplate mongoTemplate;

    public LegacyNotificationTypeMigration(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        var validTypes = Arrays.stream(NotificationType.values()).map(Enum::name).toList();
        mongoTemplate.getCollection("notifications").deleteMany(new Document("type", new Document("$nin", validTypes)));
    }
}
