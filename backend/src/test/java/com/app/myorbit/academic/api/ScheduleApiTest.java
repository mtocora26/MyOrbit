package com.app.myorbit.academic.api;

import com.app.myorbit.academic.application.SubjectService;
import com.app.myorbit.academic.domain.ClassSlot;
import com.app.myorbit.academic.domain.Subject;
import com.app.myorbit.shared.error.BusinessRuleException;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SubjectController.class)
class ScheduleApiTest {
    private static final String AUTH = "Bearer token-u1";
    private static final String BASE = "{\"name\":\"Redes\",\"credits\":3,\"semester\":\"2026-1\"";

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

    private Subject withSchedule(ClassSlot... slots) {
        Subject subject = new Subject();
        subject.setId("s1");
        subject.setUserId("u1");
        subject.update("Redes", 3, "2026-1", "#2E90FA", null, null, List.of(slots));
        return subject;
    }

    @Test
    void responseListsTheSlots() throws Exception {
        when(subjectService.listByUser("u1")).thenReturn(List.of(
                withSchedule(ClassSlot.of(1, "08:00", "10:00", "Aula 301"), ClassSlot.of(3, "14:00", "16:00", null)),
                withSchedule()));

        mockMvc.perform(get("/api/subjects").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].schedule.length()").value(2))
                .andExpect(jsonPath("$[0].schedule[0].dayOfWeek").value(1))
                .andExpect(jsonPath("$[0].schedule[0].start").value("08:00"))
                .andExpect(jsonPath("$[0].schedule[0].end").value("10:00"))
                .andExpect(jsonPath("$[0].schedule[0].room").value("Aula 301"))
                .andExpect(jsonPath("$[0].schedule[1].room").doesNotExist())
                .andExpect(jsonPath("$[1].schedule.length()").value(0));
    }

    @Test
    void createPassesTheScheduleToTheService() throws Exception {
        when(subjectService.create(eq("u1"), any(SubjectRequest.class))).thenReturn(withSchedule());

        mockMvc.perform(post("/api/subjects").header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                        .content(BASE + ",\"schedule\":[{\"dayOfWeek\":2,\"start\":\"07:30\",\"end\":\"09:30\",\"room\":\"Lab 2\"}]}"))
                .andExpect(status().isCreated());

        ArgumentCaptor<SubjectRequest> captor = ArgumentCaptor.forClass(SubjectRequest.class);
        verify(subjectService).create(eq("u1"), captor.capture());
        assertEquals(1, captor.getValue().schedule().size());
        assertEquals("07:30", captor.getValue().schedule().get(0).start());
        assertEquals("Lab 2", captor.getValue().schedule().get(0).room());
    }

    @Test
    void invalidSlotsAreRejectedBeforeReachingTheService() throws Exception {
        for (String slot : List.of(
                "{\"dayOfWeek\":0,\"start\":\"08:00\",\"end\":\"10:00\"}",
                "{\"dayOfWeek\":8,\"start\":\"08:00\",\"end\":\"10:00\"}",
                "{\"start\":\"08:00\",\"end\":\"10:00\"}",
                "{\"dayOfWeek\":1,\"start\":\"8am\",\"end\":\"10:00\"}",
                "{\"dayOfWeek\":1,\"start\":\"08:00\",\"end\":\"25:00\"}",
                "{\"dayOfWeek\":1,\"start\":\"08:00\"}")) {
            mockMvc.perform(post("/api/subjects").header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                            .content(BASE + ",\"schedule\":[" + slot + "]}"))
                    .andExpect(status().isBadRequest());
        }

        verify(subjectService, never()).create(any(), any());
    }

    @Test
    void domainRuleViolationsFromTheServiceAreBadRequest() throws Exception {
        when(subjectService.update(eq("u1"), eq("s1"), any(SubjectRequest.class)))
                .thenThrow(new BusinessRuleException("Las franjas se solapan: lunes 08:00-10:00 y lunes 09:00-11:00"));

        mockMvc.perform(put("/api/subjects/s1").header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                        .content(BASE + ",\"schedule\":[{\"dayOfWeek\":1,\"start\":\"08:00\",\"end\":\"10:00\"},{\"dayOfWeek\":1,\"start\":\"09:00\",\"end\":\"11:00\"}]}"))
                .andExpect(status().isBadRequest());
    }
}
