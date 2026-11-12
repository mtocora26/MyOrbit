package com.app.myorbit.academic.api;

import com.app.myorbit.academic.application.ClassAgendaService;
import com.app.myorbit.academic.application.ClassAgendaService.ClassNow;
import com.app.myorbit.academic.application.ClassAgendaService.ClassOccurrence;
import com.app.myorbit.academic.domain.ClassSlot;
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

import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ClassAgendaController.class)
class ClassAgendaControllerTest {
    private static final String AUTH = "Bearer token-u1";
    private static final LocalDate MONDAY = LocalDate.of(2026, 3, 2);

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ClassAgendaService classService;

    @MockitoBean
    private CurrentUserProvider currentUserProvider;

    @BeforeEach
    void authenticate() {
        User user = new User();
        user.setId("u1");
        when(currentUserProvider.requireUser(AUTH)).thenReturn(user);
        when(currentUserProvider.requireUser(null)).thenThrow(new UnauthorizedException("Sesion invalida"));
    }

    private ClassOccurrence occurrence(String room) {
        Subject subject = new Subject();
        subject.setId("s1");
        subject.setUserId("u1");
        subject.update("Redes", 3, "2026-1", "#2E90FA");
        return new ClassOccurrence(subject, ClassSlot.of(1, "08:00", "10:00", room), MONDAY);
    }

    @Test
    void listReturnsDatedClasses() throws Exception {
        when(classService.between("u1", MONDAY, MONDAY.plusDays(6))).thenReturn(List.of(occurrence("Aula 301")));

        mockMvc.perform(get("/api/academic/classes?from=2026-03-02&to=2026-03-08").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].subjectId").value("s1"))
                .andExpect(jsonPath("$[0].subjectName").value("Redes"))
                .andExpect(jsonPath("$[0].subjectColor").value("#2E90FA"))
                .andExpect(jsonPath("$[0].date").value("2026-03-02"))
                .andExpect(jsonPath("$[0].start").value("08:00"))
                .andExpect(jsonPath("$[0].end").value("10:00"))
                .andExpect(jsonPath("$[0].room").value("Aula 301"))
                .andExpect(jsonPath("$[0].startsAt").value("2026-03-02T08:00:00"))
                .andExpect(jsonPath("$[0].endsAt").value("2026-03-02T10:00:00"));
    }

    @Test
    void listRequiresBothDates() throws Exception {
        mockMvc.perform(get("/api/academic/classes?from=2026-03-02").header("Authorization", AUTH)).andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/academic/classes").header("Authorization", AUTH)).andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/academic/classes?from=hoy&to=2026-03-08").header("Authorization", AUTH)).andExpect(status().isBadRequest());
    }

    @Test
    void invalidRangeFromTheServiceIsBadRequest() throws Exception {
        when(classService.between("u1", MONDAY.plusDays(1), MONDAY)).thenThrow(new BusinessRuleException("El rango de fechas no es valido: from no puede ser posterior a to"));

        mockMvc.perform(get("/api/academic/classes?from=2026-03-03&to=2026-03-02").header("Authorization", AUTH))
                .andExpect(status().isBadRequest());
    }

    @Test
    void nowReturnsCurrentAndNext() throws Exception {
        when(classService.now("u1")).thenReturn(new ClassNow(occurrence(null), occurrence("Lab")));

        mockMvc.perform(get("/api/academic/classes/now").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.current.subjectName").value("Redes"))
                .andExpect(jsonPath("$.current.endsAt").value("2026-03-02T10:00:00"))
                .andExpect(jsonPath("$.current.room").doesNotExist())
                .andExpect(jsonPath("$.next.room").value("Lab"));
    }

    @Test
    void nowWithNothingReturnsNulls() throws Exception {
        when(classService.now("u1")).thenReturn(new ClassNow(null, null));

        mockMvc.perform(get("/api/academic/classes/now").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.current").doesNotExist())
                .andExpect(jsonPath("$.next").doesNotExist());
    }

    @Test
    void requiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/academic/classes/now")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/academic/classes?from=2026-03-02&to=2026-03-08")).andExpect(status().isUnauthorized());
    }
}
