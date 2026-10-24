package com.app.myorbit.users.infrastructure;

import com.app.myorbit.TestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.junit.jupiter.api.Assertions.assertTrue;

/** Verifica contra un Mongo real que el indice TTL de las sesiones se crea al arrancar. */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@Testcontainers(disabledWithoutDocker = true)
class SessionTtlIndexTest {
    @Autowired
    private MongoTemplate mongoTemplate;

    @Test
    void sessionsCollectionHasTtlIndexOnExpiresAt() {
        boolean ttlIndex = mongoTemplate.indexOps("user_sessions").getIndexInfo().stream()
                .anyMatch(index -> index.getExpireAfter().isPresent()
                        && index.getIndexFields().stream().anyMatch(field -> field.getKey().equals("expiresAt")));
        assertTrue(ttlIndex, "Falta el indice TTL sobre user_sessions.expiresAt");
    }
}
