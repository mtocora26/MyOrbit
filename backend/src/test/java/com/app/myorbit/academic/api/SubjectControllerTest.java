package com.app.myorbit.academic.api;

import com.app.myorbit.academic.application.SubjectService;
import com.app.myorbit.academic.domain.Subject;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SubjectController.class)
class SubjectControllerTest {
    private static final String AUTH = "Bearer token-u1";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SubjectService subjectService;

    @MockitoBean
    private CurrentUserProvider currentUserProvider;

    @BeforeEach
    void authenticate() {
        User user = new User();
        user.setId("u1");
        when(currentUserProvider.requireUser(AUTH)).thenReturn(user);
        when(currentUserProvider.requireUser(null)).thenThrow(new UnauthorizedException("Sesion invalida"));
    }

    private Subject subject() {
        Subject subject = new Subject();
        subject.setId("s1");
        subject.setUserId("u1");
        subject.update("Redes", 3, "2026-1", "#2E90FA");
        return subject;
    }

    @Test
    void listReturnsTheSubjectsOfTheCurrentUser() throws Exception {
        when(subjectService.listByUser("u1")).thenReturn(List.of(subject()));

        mockMvc.perform(get("/api/subjects").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("s1"))
                .andExpect(jsonPath("$[0].name").value("Redes"))
                .andExpect(jsonPath("$[0].credits").value(3))
                .andExpect(jsonPath("$[0].semester").value("2026-1"))
                .andExpect(jsonPath("$[0].userId").doesNotExist());
    }

    @Test
    void requestsWithoutSessionAreUnauthorized() throws Exception {
        mockMvc.perform(get("/api/subjects")).andExpect(status().isUnauthorized());
    }

    @Test
    void createRespondsCreated() throws Exception {
        when(subjectService.create(eq("u1"), any(SubjectRequest.class))).thenReturn(subject());

        mockMvc.perform(post("/api/subjects").header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Redes\",\"credits\":3,\"semester\":\"2026-1\",\"color\":\"#2E90FA\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("s1"));
    }

    @Test
    void createRejectsInvalidInput() throws Exception {
        mockMvc.perform(post("/api/subjects").header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\" \",\"credits\":0,\"semester\":\"2026\",\"color\":\"rojo\"}"))
                .andExpect(status().isBadRequest());

        verify(subjectService, never()).create(any(), any());
    }

    @Test
    void updateOfAnUnknownSubjectIsNotFound() throws Exception {
        when(subjectService.update(eq("u1"), eq("nope"), any(SubjectRequest.class))).thenThrow(new NotFoundException("Materia no encontrada"));

        mockMvc.perform(put("/api/subjects/nope").header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Redes\",\"credits\":3,\"semester\":\"2026-1\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteRespondsNoContent() throws Exception {
        mockMvc.perform(delete("/api/subjects/s1").header("Authorization", AUTH)).andExpect(status().isNoContent());

        verify(subjectService).delete("u1", "s1");
    }

    @Test
    void deleteOfAnUnknownSubjectIsNotFound() throws Exception {
        doThrow(new NotFoundException("Materia no encontrada")).when(subjectService).delete("u1", "nope");

        mockMvc.perform(delete("/api/subjects/nope").header("Authorization", AUTH)).andExpect(status().isNotFound());
    }
}
