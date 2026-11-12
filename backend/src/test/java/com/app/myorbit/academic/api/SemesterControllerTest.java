package com.app.myorbit.academic.api;

import com.app.myorbit.academic.application.SemesterService;
import com.app.myorbit.academic.domain.Semester;
import com.app.myorbit.shared.error.BusinessRuleException;
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

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SemesterController.class)
class SemesterControllerTest {
    private static final String AUTH = "Bearer token-u1";
    private static final LocalDate TODAY = LocalDate.of(2026, 4, 1);

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SemesterService semesterService;

    @MockitoBean
    private CurrentUserProvider currentUserProvider;

    @BeforeEach
    void authenticate() {
        User user = new User();
        user.setId("u1");
        when(currentUserProvider.requireUser(AUTH)).thenReturn(user);
        when(currentUserProvider.requireUser(null)).thenThrow(new UnauthorizedException("Sesion invalida"));
        when(semesterService.today("u1")).thenReturn(TODAY);
    }

    private Semester semester(String name, LocalDate start, LocalDate end) {
        Semester semester = new Semester();
        semester.setId("m1");
        semester.setUserId("u1");
        semester.update(name, start, end);
        return semester;
    }

    @Test
    void listMarksTheCurrentOneAndMissingDates() throws Exception {
        when(semesterService.listByUser("u1")).thenReturn(List.of(
                semester("2026-1", LocalDate.of(2026, 2, 1), LocalDate.of(2026, 6, 15)),
                semester("2025-2", null, null)));

        mockMvc.perform(get("/api/semesters").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].current").value(true))
                .andExpect(jsonPath("$[0].missingDates").value(false))
                .andExpect(jsonPath("$[1].current").value(false))
                .andExpect(jsonPath("$[1].missingDates").value(true));
    }

    @Test
    void createReturns201() throws Exception {
        when(semesterService.create(eq("u1"), any(SemesterRequest.class)))
                .thenReturn(semester("2026-1", LocalDate.of(2026, 2, 1), LocalDate.of(2026, 6, 15)));

        mockMvc.perform(post("/api/semesters").header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"2026-1\",\"startDate\":\"2026-02-01\",\"endDate\":\"2026-06-15\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("2026-1"))
                .andExpect(jsonPath("$.startDate").value("2026-02-01"));
    }

    @Test
    void createRejectsABadNameWith400() throws Exception {
        mockMvc.perform(post("/api/semesters").header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"2026-3\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateBusinessErrorIs400() throws Exception {
        when(semesterService.update(eq("u1"), eq("m1"), any(SemesterRequest.class))).thenThrow(new BusinessRuleException("Ya tienes el semestre 2026-1"));

        mockMvc.perform(put("/api/semesters/m1").header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"2026-1\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteReturns204() throws Exception {
        mockMvc.perform(delete("/api/semesters/m1").header("Authorization", AUTH)).andExpect(status().isNoContent());
        verify(semesterService).delete("u1", "m1");
    }

    @Test
    void requiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/semesters")).andExpect(status().isUnauthorized());
    }
}
