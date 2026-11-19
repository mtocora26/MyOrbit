package com.app.myorbit.shared.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class OpenApiConfigTest {
    @Test
    void declaraEsquemaBearerComoRequisitoGlobal() {
        OpenAPI api = new OpenApiConfig().myOrbitOpenApi();

        assertEquals("MyOrbit API", api.getInfo().getTitle());
        assertEquals(SecurityScheme.Type.HTTP, api.getComponents().getSecuritySchemes().get("bearer").getType());
        assertEquals("bearer", api.getComponents().getSecuritySchemes().get("bearer").getScheme());
        assertFalse(api.getSecurity().isEmpty());
    }
}
