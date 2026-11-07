package com.app.myorbit.academic.api;

import com.app.myorbit.academic.application.EvaluationAgendaService;
import com.app.myorbit.academic.application.EvaluationAgendaService.AgendaItem;
import com.app.myorbit.academic.domain.Evaluation;
import com.app.myorbit.academic.domain.Subject;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.UnauthorizedException;
import com.app.myorbit.users.application.CurrentUserProvider;
import com.app.myorbit.users.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EvaluationAgendaController.class)
class EvaluationAgendaControllerTest {
    private static final String AUTH = "Bearer token-u1";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EvaluationAgendaService agendaService;

    @MockitoBean
    private CurrentUserProvider currentUserProvider;

    @BeforeEach
    void authenticate() {
        User user = new User();
        user.setId("u1");
        when(currentUserProvider.requireUser(AUTH)).thenReturn(user);
        when(currentUserProvider.requireUser(null)).thenThrow(new UnauthorizedException("Sesion invalida"));
    }

    private AgendaItem item() {
        Subject subject = new Subject();
        subject.setId("s1");
        subject.setUserId("u1");
        subject.update("Redes", 3, "2026-2", "#2E90FA");
        Evaluation evaluation = new Evaluation();
        evaluation.setId("e1");
        evaluation.setUserId("u1");
        evaluation.setSubjectId("s1");
        evaluation.update("Parcial 2", 30, null, LocalDateTime.of(2026, 11, 20, 8, 0));
        return new AgendaItem(evaluation, subject);
    }

    @Test
    void listReturnsDatedEvaluationsWithTheirSubject() throws Exception {
        when(agendaService.listWithDue(any(), isNull(), isNull())).thenReturn(List.of(item()));

        mockMvc.perform(get("/api/academic/evaluations").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("e1"))
                .andExpect(jsonPath("$[0].subjectName").value("Redes"))
                .andExpect(jsonPath("$[0].subjectColor").value("#2E90FA"))
                .andExpect(jsonPath("$[0].name").value("Parcial 2"))
                .andExpect(jsonPath("$[0].due").value("2026-11-20T08:00:00"));
    }

    @Test
    void listPassesTheRange() throws Exception {
        when(agendaService.listWithDue("u1", LocalDateTime.of(2026, 11, 1, 0, 0), LocalDateTime.of(2026, 11, 30, 23, 59))).thenReturn(List.of());

        mockMvc.perform(get("/api/academic/evaluations?dueFrom=2026-11-01T00:00&dueTo=2026-11-30T23:59").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void invertedRangeIsBadRequest() throws Exception {
        when(agendaService.listWithDue(any(), any(), any())).thenThrow(new BusinessRuleException("El rango de fechas no es valido"));

        mockMvc.perform(get("/api/academic/evaluations?dueFrom=2026-12-01T00:00&dueTo=2026-11-01T00:00").header("Authorization", AUTH))
                .andExpect(status().isBadRequest());
    }

    @Test
    void requiresASession() throws Exception {
        mockMvc.perform(get("/api/academic/evaluations")).andExpect(status().isUnauthorized());
    }
}
