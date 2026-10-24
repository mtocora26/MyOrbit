package com.app.myorbit.shared.config;

import com.app.myorbit.TestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "myorbit.cors.allowed-origins=https://app.myorbit.test")
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@Testcontainers(disabledWithoutDocker = true)
class CorsConfigTest {
    @Autowired
    private MockMvc mockMvc;

    private org.springframework.test.web.servlet.ResultActions preflight(String origin, String path) throws Exception {
        return mockMvc.perform(options(path)
                .header("Origin", origin)
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "Authorization,Content-Type"));
    }

    @Test
    void configuredOriginPassesPreflightOnAnyApiRoute() throws Exception {
        for (String path : new String[] {"/api/tasks", "/api/habits", "/api/auth/login", "/api/admin/users"}) {
            preflight("https://app.myorbit.test", path)
                    .andExpect(status().isOk())
                    .andExpect(header().string("Access-Control-Allow-Origin", "https://app.myorbit.test"));
        }
    }

    @Test
    void otherOriginsAreRejected() throws Exception {
        preflight("https://evil.example", "/api/tasks").andExpect(status().isForbidden());
    }
}
