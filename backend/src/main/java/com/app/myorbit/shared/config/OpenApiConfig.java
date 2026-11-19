package com.app.myorbit.shared.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Metadatos de la documentacion OpenAPI (Swagger UI en /swagger-ui.html, JSON en /v3/api-docs).
 * La sesion viaja como token opaco en {@code Authorization: Bearer <token>} (se obtiene en /api/auth/login).
 */
@Configuration
public class OpenApiConfig {
    private static final String BEARER = "bearer";

    @Bean
    public OpenAPI myOrbitOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("MyOrbit API")
                        .description("API REST de MyOrbit. Errores como ProblemDetail (RFC 9457). "
                                + "Inicia sesion en /api/auth/login y pega el token en Authorize.")
                        .version("0.0.1"))
                .components(new Components().addSecuritySchemes(BEARER, new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .description("Token de sesion devuelto por /api/auth/login o /api/auth/register")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER));
    }
}
