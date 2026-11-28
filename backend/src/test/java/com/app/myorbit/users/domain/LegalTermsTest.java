package com.app.myorbit.users.domain;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LegalTermsTest {

    @Test
    void shouldMatchTheVersionOfTheTextsShownByTheApp() throws IOException {
        String documents = Files.readString(Path.of("..", "frontend", "src", "legal", "documents.ts"));

        assertTrue(documents.contains("LEGAL_VERSION = \"" + LegalTerms.CURRENT_VERSION + "\""),
                "la versión del backend y la de frontend/src/legal/documents.ts deben ser la misma");
    }

    @Test
    void shouldBePending_untilTheCurrentVersionIsAccepted() {
        User user = new User();
        assertTrue(user.hasPendingTerms());

        user.acceptTerms("0.9", AgeDeclaration.ADULT, Instant.EPOCH);
        assertTrue(user.hasPendingTerms());

        user.acceptTerms(LegalTerms.CURRENT_VERSION, AgeDeclaration.MINOR_AUTHORIZED, Instant.EPOCH);
        assertFalse(user.hasPendingTerms());
    }
}
