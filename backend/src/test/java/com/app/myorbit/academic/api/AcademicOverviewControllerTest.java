package com.app.myorbit.academic.api;

import com.app.myorbit.academic.application.SemesterService;
import com.app.myorbit.academic.application.SubjectService;
import com.app.myorbit.academic.domain.Semester;
import com.app.myorbit.academic.domain.Subject;
import com.app.myorbit.shared.error.UnauthorizedException;
import com.app.myorbit.users.application.CurrentUserProvider;
import com.app.myorbit.users.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AcademicOverviewController.class)
class AcademicOverviewControllerTest {
    private static final String AUTH = "******";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SubjectService subjectService;

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
    }

    @Test
    void returnsSubjectsAndSemestersInOneResponse() throws Exception {
        Subject subject = new Subject();
        subject.setId("s1");
        subject.setUserId("u1");
        subject.update("Redes", 3, "2026-1", "#2E90FA");
        Semester semester = new Semester();
        semester.setId("m1");
        semester.setUserId("u1");
        semester.update("2026-1", LocalDate.of(2026, 1, 20), LocalDate.of(2026, 6, 1));
        when(semesterService.today("u1")).thenReturn(LocalDate.of(2026, 4, 1));
        when(subjectService.listByUser("u1")).thenReturn(List.of(subject));
        when(semesterService.listByUser("u1")).thenReturn(List.of(semester));

        mockMvc.perform(get("/api/academic/overview").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subjects[0].name").value("Redes"))
                .andExpect(jsonPath("$.semesters[0].name").value("2026-1"))
                .andExpect(jsonPath("$.semesters[0].current").value(true));
    }

    @Test
    void requestsWithoutSessionAreUnauthorized() throws Exception {
        mockMvc.perform(get("/api/academic/overview")).andExpect(status().isUnauthorized());
    }
}
