package com.app.myorbit.users.api;

import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.UnauthorizedException;
import com.app.myorbit.users.application.AuthService;
import com.app.myorbit.users.domain.Role;
import com.app.myorbit.users.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
class AuthControllerTest {
    private static final String AUTH = "******";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;

    @BeforeEach
    void authenticate() {
        User user = new User();
        user.setId("u1");
        user.setName("Ana");
        user.setEmail("ana@uni.edu");
        user.setRole(Role.USER);
        when(authService.requireUser(AUTH)).thenReturn(user);
        when(authService.requireUser(null)).thenThrow(new UnauthorizedException("Sesion invalida"));
    }

    @Test
    void updateNameReturnsUpdatedAccount() throws Exception {
        User updated = new User();
        updated.setId("u1");
        updated.setName("Ana María");
        updated.setEmail("ana@uni.edu");
        updated.setRole(Role.USER);
        when(authService.updateName(eq("u1"), eq("Ana María"))).thenReturn(updated);

        mockMvc.perform(put("/api/auth/me/name").header("Authorization", AUTH)
                        .contentType("application/json")
                        .content("{\"name\":\"Ana María\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("u1"))
                .andExpect(jsonPath("$.name").value("Ana María"))
                .andExpect(jsonPath("$.email").value("ana@uni.edu"));
    }

    @Test
    void updateNameRejectsBlank() throws Exception {
        mockMvc.perform(put("/api/auth/me/name").header("Authorization", AUTH)
                        .contentType("application/json")
                        .content("{\"name\":\" \"}"))
                .andExpect(status().isBadRequest());

        verify(authService, never()).updateName(any(), any());
    }

    @Test
    void updateNameWithoutSessionIsUnauthorized() throws Exception {
        mockMvc.perform(put("/api/auth/me/name").contentType("application/json")
                        .content("{\"name\":\"Ana\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void changePasswordRespondsNoContent() throws Exception {
        mockMvc.perform(put("/api/auth/me/password").header("Authorization", AUTH)
                        .contentType("application/json")
                        .content("{\"currentPassword\":\"actual123\",\"newPassword\":\"nueva-secreta\"}"))
                .andExpect(status().isNoContent());

        verify(authService).changePassword("u1", AUTH, "actual123", "nueva-secreta");
    }

    @Test
    void changePasswordRejectsShortNewPassword() throws Exception {
        mockMvc.perform(put("/api/auth/me/password").header("Authorization", AUTH)
                        .contentType("application/json")
                        .content("{\"currentPassword\":\"actual123\",\"newPassword\":\"corta\"}"))
                .andExpect(status().isBadRequest());

        verify(authService, never()).changePassword(any(), any(), any(), any());
    }

    @Test
    void changePasswordWithWrongCurrentIsUnauthorized() throws Exception {
        org.mockito.Mockito.doThrow(new UnauthorizedException("La contrasena actual es incorrecta"))
                .when(authService).changePassword(eq("u1"), eq(AUTH), any(), any());

        mockMvc.perform(put("/api/auth/me/password").header("Authorization", AUTH)
                        .contentType("application/json")
                        .content("{\"currentPassword\":\"mal\",\"newPassword\":\"nueva-secreta\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void updateTimeZoneReturnsTheAccountWithItsZone() throws Exception {
        User updated = new User();
        updated.setId("u1");
        updated.setName("Ana");
        updated.setEmail("ana@uni.edu");
        updated.setRole(Role.USER);
        updated.setTimeZone("America/Bogota");
        when(authService.updateTimeZone("u1", "America/Bogota")).thenReturn(updated);

        mockMvc.perform(put("/api/auth/me/timezone").header("Authorization", AUTH)
                        .contentType("application/json")
                        .content("{\"timeZone\":\"America/Bogota\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.timeZone").value("America/Bogota"));
    }

    @Test
    void updateTimeZoneRejectsBlankAndRequiresASession() throws Exception {
        mockMvc.perform(put("/api/auth/me/timezone").header("Authorization", AUTH)
                        .contentType("application/json").content("{\"timeZone\":\" \"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/auth/me/timezone").contentType("application/json").content("{\"timeZone\":\"America/Bogota\"}"))
                .andExpect(status().isUnauthorized());
        verify(authService, never()).updateTimeZone(any(), any());
    }
}
