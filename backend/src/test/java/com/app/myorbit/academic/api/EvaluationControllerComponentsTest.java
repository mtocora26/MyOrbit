package com.app.myorbit.academic.api;

import com.app.myorbit.academic.application.EvaluationService;
import com.app.myorbit.academic.application.GradeSummaryService;
import com.app.myorbit.academic.domain.Evaluation;
import com.app.myorbit.academic.domain.EvaluationComponent;
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

@WebMvcTest(EvaluationController.class)
class EvaluationControllerComponentsTest {
    private static final String AUTH = "Bearer token-u1";
    private static final String BASE = "/api/subjects/s1/evaluations";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EvaluationService evaluationService;

    @MockitoBean
    private GradeSummaryService gradeSummaryService;

    @MockitoBean
    private CurrentUserProvider currentUserProvider;

    @BeforeEach
    void authenticate() {
        User user = new User();
        user.setId("u1");
        when(currentUserProvider.requireUser(AUTH)).thenReturn(user);
        when(currentUserProvider.requireUser(null)).thenThrow(new UnauthorizedException("Sesion invalida"));
    }

    private Evaluation cut(EvaluationComponent... components) {
        Evaluation evaluation = new Evaluation();
        evaluation.setId("e1");
        evaluation.setUserId("u1");
        evaluation.setSubjectId("s1");
        evaluation.update("Corte 1", 30, null, null, List.of(components));
        return evaluation;
    }

    @Test
    void incompleteCutExposesProvisionalGradeAndNoDefinitiveOne() throws Exception {
        when(evaluationService.list("u1", "s1")).thenReturn(List.of(
                cut(EvaluationComponent.of("Parcial", 70, 4.0), EvaluationComponent.of("Actividades", 30, null))));

        mockMvc.perform(get(BASE).header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].grade").doesNotExist())
                .andExpect(jsonPath("$[0].provisionalGrade").value(4.0))
                .andExpect(jsonPath("$[0].complete").value(false))
                .andExpect(jsonPath("$[0].components.length()").value(2))
                .andExpect(jsonPath("$[0].components[0].name").value("Parcial"))
                .andExpect(jsonPath("$[0].components[0].percentage").value(70.0));
    }

    @Test
    void completeCutExposesTheWeightedGrade() throws Exception {
        when(evaluationService.list("u1", "s1")).thenReturn(List.of(
                cut(EvaluationComponent.of("Parcial", 70, 4.0), EvaluationComponent.of("Actividades", 30, 3.0))));

        mockMvc.perform(get(BASE).header("Authorization", AUTH))
                .andExpect(jsonPath("$[0].grade").value(3.7))
                .andExpect(jsonPath("$[0].complete").value(true));
    }

    @Test
    void evaluationWithoutComponentsStillRespondsWithAnEmptyList() throws Exception {
        Evaluation direct = new Evaluation();
        direct.setId("e2");
        direct.update("Final", 40, 4.5);
        when(evaluationService.list("u1", "s1")).thenReturn(List.of(direct));

        mockMvc.perform(get(BASE).header("Authorization", AUTH))
                .andExpect(jsonPath("$[0].grade").value(4.5))
                .andExpect(jsonPath("$[0].components.length()").value(0));
    }

    @Test
    void createPassesTheComponentsToTheService() throws Exception {
        when(evaluationService.create(eq("u1"), eq("s1"), any(EvaluationRequest.class)))
                .thenReturn(cut(EvaluationComponent.of("Parcial", 100, null)));

        mockMvc.perform(post(BASE).header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Corte 1\",\"percentage\":30,\"components\":[{\"name\":\"Parcial\",\"percentage\":100}]}"))
                .andExpect(status().isCreated());

        ArgumentCaptor<EvaluationRequest> captor = ArgumentCaptor.forClass(EvaluationRequest.class);
        verify(evaluationService).create(eq("u1"), eq("s1"), captor.capture());
        assertEquals(1, captor.getValue().components().size());
        assertEquals("Parcial", captor.getValue().components().get(0).name());
    }

    @Test
    void createRejectsAnInvalidComponent() throws Exception {
        mockMvc.perform(post(BASE).header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Corte 1\",\"percentage\":30,\"components\":[{\"name\":\" \",\"percentage\":0,\"grade\":6}]}"))
                .andExpect(status().isBadRequest());

        verify(evaluationService, never()).create(any(), any(), any());
    }
}
