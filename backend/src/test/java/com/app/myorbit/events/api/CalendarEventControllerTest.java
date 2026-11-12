package com.app.myorbit.events.api;

import com.app.myorbit.events.application.CalendarEventService;
import com.app.myorbit.events.domain.CalendarEvent;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.NotFoundException;
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
import static org.junit.jupiter.api.Assertions.assertNull;
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

@WebMvcTest(CalendarEventController.class)
class CalendarEventControllerTest {
    private static final String AUTH = "Bearer token-u1";
    private static final LocalDate MON = LocalDate.of(2026, 3, 2);
    private static final LocalDate FRI = LocalDate.of(2026, 3, 6);

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CalendarEventService eventService;

    @MockitoBean
    private CurrentUserProvider currentUserProvider;

    @BeforeEach
    void authenticate() {
        User user = new User();
        user.setId("u1");
        when(currentUserProvider.requireUser(AUTH)).thenReturn(user);
        when(currentUserProvider.requireUser(null)).thenThrow(new UnauthorizedException("Sesion invalida"));
    }

    private CalendarEvent event(LocalDate start, LocalDate end, String startTime) {
        CalendarEvent event = new CalendarEvent();
        event.setId("e1");
        event.setUserId("u1");
        event.update("Semana de parciales", start, end, startTime, null);
        event.setSubjectId("redes");
        return event;
    }

    @Test
    void listReturnsEventsWithTheirRange() throws Exception {
        when(eventService.list("u1", MON, FRI)).thenReturn(List.of(event(MON, FRI, null), event(MON, null, "08:00")));

        mockMvc.perform(get("/api/events?from=2026-03-02&to=2026-03-06").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Semana de parciales"))
                .andExpect(jsonPath("$[0].startDate").value("2026-03-02"))
                .andExpect(jsonPath("$[0].endDate").value("2026-03-06"))
                .andExpect(jsonPath("$[0].multiDay").value(true))
                .andExpect(jsonPath("$[0].startTime").doesNotExist())
                .andExpect(jsonPath("$[0].subjectId").value("redes"))
                .andExpect(jsonPath("$[1].multiDay").value(false))
                .andExpect(jsonPath("$[1].startTime").value("08:00"))
                .andExpect(jsonPath("$[0].userId").doesNotExist());
    }

    @Test
    void listWithoutRangeAsksForEverything() throws Exception {
        when(eventService.list("u1", null, null)).thenReturn(List.of());

        mockMvc.perform(get("/api/events").header("Authorization", AUTH)).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void listRejectsABadDateAndAnInvertedRange() throws Exception {
        mockMvc.perform(get("/api/events?from=mañana").header("Authorization", AUTH)).andExpect(status().isBadRequest());

        when(eventService.list("u1", FRI, MON)).thenThrow(new BusinessRuleException("El rango de fechas no es valido: from no puede ser posterior a to"));
        mockMvc.perform(get("/api/events?from=2026-03-06&to=2026-03-02").header("Authorization", AUTH)).andExpect(status().isBadRequest());
    }

    @Test
    void createRespondsCreatedWithTheRequestData() throws Exception {
        when(eventService.create(eq("u1"), any(CalendarEventRequest.class))).thenReturn(event(MON, FRI, null));

        mockMvc.perform(post("/api/events").header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Semana de parciales\",\"startDate\":\"2026-03-02\",\"endDate\":\"2026-03-06\",\"subjectId\":\"redes\",\"startTime\":\"08:00\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("e1"));

        ArgumentCaptor<CalendarEventRequest> captor = ArgumentCaptor.forClass(CalendarEventRequest.class);
        verify(eventService).create(eq("u1"), captor.capture());
        assertEquals(MON, captor.getValue().startDate());
        assertEquals(FRI, captor.getValue().endDate());
        assertEquals("08:00", captor.getValue().startTime());
        assertNull(captor.getValue().categoryId());
    }

    @Test
    void createRejectsInvalidInputBeforeReachingTheService() throws Exception {
        for (String body : List.of(
                "{\"startDate\":\"2026-03-02\"}",
                "{\"title\":\" \",\"startDate\":\"2026-03-02\"}",
                "{\"title\":\"Parcial\"}",
                "{\"title\":\"Parcial\",\"startDate\":\"02/03/2026\"}",
                "{\"title\":\"Parcial\",\"startDate\":\"2026-03-02\",\"startTime\":\"8am\"}",
                "{\"title\":\"Parcial\",\"startDate\":\"2026-03-02\",\"startTime\":\"08:00\",\"endTime\":\"25:00\"}")) {
            mockMvc.perform(post("/api/events").header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest());
        }

        verify(eventService, never()).create(any(), any());
    }

    @Test
    void domainRuleViolationsFromTheServiceAreBadRequest() throws Exception {
        when(eventService.create(eq("u1"), any(CalendarEventRequest.class))).thenThrow(new BusinessRuleException("La fecha de fin no puede ser anterior a la de inicio"));

        mockMvc.perform(post("/api/events").header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Parcial\",\"startDate\":\"2026-03-06\",\"endDate\":\"2026-03-02\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateAndDeleteGoThroughTheService() throws Exception {
        when(eventService.update(eq("u1"), eq("e1"), any(CalendarEventRequest.class))).thenReturn(event(MON, null, null));

        mockMvc.perform(put("/api/events/e1").header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Semana de parciales\",\"startDate\":\"2026-03-02\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(delete("/api/events/e1").header("Authorization", AUTH)).andExpect(status().isNoContent());

        verify(eventService).delete("u1", "e1");
    }

    @Test
    void unknownEventIsNotFound() throws Exception {
        when(eventService.getOwned("u1", "x")).thenThrow(new NotFoundException("Evento no encontrado"));

        mockMvc.perform(get("/api/events/x").header("Authorization", AUTH)).andExpect(status().isNotFound());
    }

    @Test
    void requiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/events")).andExpect(status().isUnauthorized());
        // Con un cuerpo válido: la validación del cuerpo corre antes que la sesión, así que uno inválido daría 400.
        mockMvc.perform(post("/api/events").contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Parcial\",\"startDate\":\"2026-03-02\"}")).andExpect(status().isUnauthorized());
    }
}
