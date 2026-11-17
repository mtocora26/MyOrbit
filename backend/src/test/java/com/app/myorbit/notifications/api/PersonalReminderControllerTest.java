package com.app.myorbit.notifications.api;

import com.app.myorbit.notifications.application.PersonalReminderService;
import com.app.myorbit.notifications.domain.PersonalReminder;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.NotFoundException;
import com.app.myorbit.shared.error.UnauthorizedException;
import com.app.myorbit.users.application.CurrentUserProvider;
import com.app.myorbit.users.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PersonalReminderController.class)
class PersonalReminderControllerTest {
    private static final String AUTH = "Bearer token-u1";
    private static final LocalDateTime AT = LocalDateTime.of(2026, 11, 20, 8, 30);
    private static final String BODY = "{\"text\":\"Llamar al banco\",\"remindAt\":\"2026-11-20T08:30:00\"}";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PersonalReminderService service;

    @MockitoBean
    private CurrentUserProvider currentUserProvider;

    @BeforeEach
    void authenticate() {
        User user = new User();
        user.setId("u1");
        when(currentUserProvider.requireUser(AUTH)).thenReturn(user);
        when(currentUserProvider.requireUser(null)).thenThrow(new UnauthorizedException("Sesion invalida"));
    }

    private PersonalReminder reminder() {
        PersonalReminder reminder = new PersonalReminder();
        reminder.setId("r1");
        reminder.setUserId("u1");
        reminder.setText("Llamar al banco");
        reminder.setRemindAt(AT);
        return reminder;
    }

    @Test
    void listReturnsThePendingReminders() throws Exception {
        when(service.listPending("u1")).thenReturn(List.of(reminder()));

        mockMvc.perform(get("/api/reminders").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("r1"))
                .andExpect(jsonPath("$[0].text").value("Llamar al banco"))
                .andExpect(jsonPath("$[0].remindAt").value("2026-11-20T08:30:00"));
    }

    @Test
    void createReturns201WithTheReminder() throws Exception {
        when(service.create("u1", "Llamar al banco", AT)).thenReturn(reminder());

        mockMvc.perform(post("/api/reminders").header("Authorization", AUTH)
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("r1"));
    }

    @Test
    void createRejectsMissingFieldsAndTooLongText() throws Exception {
        mockMvc.perform(post("/api/reminders").header("Authorization", AUTH)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"text\":\"\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/reminders").header("Authorization", AUTH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"" + "x".repeat(141) + "\",\"remindAt\":\"2026-11-20T08:30:00\"}"))
                .andExpect(status().isBadRequest());
        verify(service, never()).create(anyString(), anyString(), any());
    }

    @Test
    void createReportsABusinessRuleViolation() throws Exception {
        when(service.create("u1", "Llamar al banco", AT)).thenThrow(new BusinessRuleException("Elige una hora en el futuro"));

        mockMvc.perform(post("/api/reminders").header("Authorization", AUTH)
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void deleteReturns204AndNotFoundForForeignOnes() throws Exception {
        mockMvc.perform(delete("/api/reminders/r1").header("Authorization", AUTH)).andExpect(status().isNoContent());
        verify(service).delete("u1", "r1");

        doThrow(new NotFoundException("Recordatorio no encontrado")).when(service).delete("u1", "ajeno");
        mockMvc.perform(delete("/api/reminders/ajeno").header("Authorization", AUTH)).andExpect(status().isNotFound());
    }

    @Test
    void requireASession() throws Exception {
        mockMvc.perform(get("/api/reminders")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/reminders").contentType(MediaType.APPLICATION_JSON).content(BODY)).andExpect(status().isUnauthorized());
    }
}
