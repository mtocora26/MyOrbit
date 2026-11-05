package com.app.myorbit.academic.api;

import com.app.myorbit.academic.application.EvaluationService;
import com.app.myorbit.academic.domain.Evaluation;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EvaluationController.class)
class EvaluationControllerTest {
    private static final String AUTH = "******";
    private static final String BASE = "/api/subjects/s1/evaluations";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EvaluationService evaluationService;

    @MockitoBean
    private CurrentUserProvider currentUserProvider;

    @BeforeEach
    void authenticate() {
        User user = new User();
        user.setId("u1");
        when(currentUserProvider.requireUser(AUTH)).thenReturn(user);
        when(currentUserProvider.requireUser(null)).thenThrow(new UnauthorizedException("Sesion invalida"));
    }

    private Evaluation evaluation() {
        Evaluation evaluation = new Evaluation();
        evaluation.setId("e1");
        evaluation.setUserId("u1");
        evaluation.setSubjectId("s1");
        evaluation.update("Parcial 1", 30, 4.5);
        return evaluation;
    }

    @Test
    void listReturnsEvaluationsWithoutOwnerData() throws Exception {
        when(evaluationService.list("u1", "s1")).thenReturn(List.of(evaluation()));

        mockMvc.perform(get(BASE).header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("e1"))
                .andExpect(jsonPath("$[0].name").value("Parcial 1"))
                .andExpect(jsonPath("$[0].percentage").value(30.0))
                .andExpect(jsonPath("$[0].grade").value(4.5))
                .andExpect(jsonPath("$[0].userId").doesNotExist());
    }

    @Test
    void requestsWithoutSessionAreUnauthorized() throws Exception {
        mockMvc.perform(get(BASE)).andExpect(status().isUnauthorized());
    }

    @Test
    void createRespondsCreatedAndAcceptsMissingGrade() throws Exception {
        when(evaluationService.create(eq("u1"), eq("s1"), any(EvaluationRequest.class))).thenReturn(evaluation());

        mockMvc.perform(post(BASE).header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Parcial 1\",\"percentage\":30}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("e1"));
    }

    @Test
    void createRejectsInvalidInput() throws Exception {
        mockMvc.perform(post(BASE).header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\" \",\"percentage\":0,\"grade\":6}"))
                .andExpect(status().isBadRequest());

        verify(evaluationService, never()).create(any(), any(), any());
    }

    @Test
    void createAboveTheRemainingPercentageIsBadRequest() throws Exception {
        when(evaluationService.create(eq("u1"), eq("s1"), any(EvaluationRequest.class)))
                .thenThrow(new BusinessRuleException("La suma de porcentajes no puede superar 100%. Disponible: 10%"));

        mockMvc.perform(post(BASE).header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Final\",\"percentage\":40}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateOfAnUnknownEvaluationIsNotFound() throws Exception {
        when(evaluationService.update(eq("u1"), eq("s1"), eq("nope"), any(EvaluationRequest.class)))
                .thenThrow(new NotFoundException("Evaluacion no encontrada"));

        mockMvc.perform(put(BASE + "/nope").header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Parcial\",\"percentage\":30}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteRespondsNoContent() throws Exception {
        mockMvc.perform(delete(BASE + "/e1").header("Authorization", AUTH)).andExpect(status().isNoContent());

        verify(evaluationService).delete("u1", "s1", "e1");
    }
}
