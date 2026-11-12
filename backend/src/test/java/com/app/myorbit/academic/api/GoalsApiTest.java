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
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest({SubjectController.class, SemesterController.class})
class GoalsApiTest {
    private static final String AUTH = "Bearer token-u1";

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
        when(semesterService.today("u1")).thenReturn(LocalDate.of(2026, 4, 1));
    }

    private Subject subject(Double target, Double passing) {
        Subject subject = new Subject();
        subject.setId("s1");
        subject.setUserId("u1");
        subject.update("Redes", 3, "2026-1", "#2E90FA", target, passing);
        return subject;
    }

    @Test
    void subjectResponseExposesItsGoals() throws Exception {
        when(subjectService.listByUser("u1")).thenReturn(List.of(subject(4.5, 3.5), subject(null, null)));

        mockMvc.perform(get("/api/subjects").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].targetGrade").value(4.5))
                .andExpect(jsonPath("$[0].passingGrade").value(3.5))
                .andExpect(jsonPath("$[1].targetGrade").doesNotExist())
                .andExpect(jsonPath("$[1].passingGrade").doesNotExist());
    }

    @Test
    void subjectRequestAcceptsGoals() throws Exception {
        when(subjectService.create(eq("u1"), any(SubjectRequest.class))).thenReturn(subject(4.5, 3.5));

        mockMvc.perform(post("/api/subjects").header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Redes\",\"credits\":3,\"semester\":\"2026-1\",\"targetGrade\":4.5,\"passingGrade\":3.5}"))
                .andExpect(status().isCreated());

        ArgumentCaptor<SubjectRequest> captor = ArgumentCaptor.forClass(SubjectRequest.class);
        verify(subjectService).create(eq("u1"), captor.capture());
        assertEquals(4.5, captor.getValue().targetGrade());
        assertEquals(3.5, captor.getValue().passingGrade());
    }

    @Test
    void subjectGoalsOutOfRangeAreRejected() throws Exception {
        mockMvc.perform(post("/api/subjects").header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Redes\",\"credits\":3,\"semester\":\"2026-1\",\"targetGrade\":5.5}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/subjects").header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Redes\",\"credits\":3,\"semester\":\"2026-1\",\"passingGrade\":-1}"))
                .andExpect(status().isBadRequest());

        verify(subjectService, never()).create(any(), any());
    }

    @Test
    void semesterResponseExposesTheTargetAverage() throws Exception {
        Semester semester = new Semester();
        semester.setId("m1");
        semester.setUserId("u1");
        semester.update("2026-1", null, null, 4.0);
        when(semesterService.listByUser("u1")).thenReturn(List.of(semester));

        mockMvc.perform(get("/api/semesters").header("Authorization", AUTH))
                .andExpect(jsonPath("$[0].targetAverage").value(4.0));
    }

    @Test
    void semesterTargetOutOfRangeIsRejected() throws Exception {
        mockMvc.perform(post("/api/semesters").header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"2026-1\",\"targetAverage\":6}"))
                .andExpect(status().isBadRequest());

        verify(semesterService, never()).create(any(), any());
    }
}
