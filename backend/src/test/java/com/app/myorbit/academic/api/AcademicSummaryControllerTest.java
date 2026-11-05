package com.app.myorbit.academic.api;

import com.app.myorbit.academic.application.AcademicSummary;
import com.app.myorbit.academic.application.AcademicSummaryService;
import com.app.myorbit.academic.application.GradeSummary;
import com.app.myorbit.shared.error.UnauthorizedException;
import com.app.myorbit.users.application.CurrentUserProvider;
import com.app.myorbit.users.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AcademicSummaryController.class)
class AcademicSummaryControllerTest {
    private static final String AUTH = "******";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AcademicSummaryService summaryService;

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
    void returnsAverageAndAtRiskSubjects() throws Exception {
        GradeSummary grades = new GradeSummary(2.0, 1.0, 50.0, 50.0, 3.0, 4.5, true);
        AcademicSummary summary = AcademicSummary.builder(3.0).addSubject("s1", "Redes", 3, "2026-1", grades).build();
        when(summaryService.summarize("u1", "2026-1", null)).thenReturn(summary);

        mockMvc.perform(get("/api/academic/summary").param("semester", "2026-1").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.weightedAverage").value(2.0))
                .andExpect(jsonPath("$.totalCredits").value(3))
                .andExpect(jsonPath("$.subjects[0].name").value("Redes"))
                .andExpect(jsonPath("$.atRisk[0].subjectId").value("s1"))
                .andExpect(jsonPath("$.atRisk[0].grades.requiredGrade").value(4.5));
    }

    @Test
    void requestsWithoutSessionAreUnauthorized() throws Exception {
        mockMvc.perform(get("/api/academic/summary")).andExpect(status().isUnauthorized());
    }
}
