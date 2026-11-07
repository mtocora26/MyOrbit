package com.app.myorbit.habits.api;

import com.app.myorbit.habits.application.HabitService;
import com.app.myorbit.habits.domain.Habit;
import com.app.myorbit.habits.domain.HabitFrequency;
import com.app.myorbit.habits.domain.HabitStats;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(HabitController.class)
class HabitControllerTest {
    private static final String AUTH = "Bearer token-u1";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private HabitService habitService;

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
    void updateReturnsTheEditedHabit() throws Exception {
        Habit habit = new Habit();
        habit.setId("h1");
        habit.setUserId("u1");
        habit.setTitle("Correr");
        habit.setFrequency(HabitFrequency.CUSTOM);
        habit.setDaysOfWeek(List.of(2, 4));
        habit.setColor("#12B76A");
        habit.setIcon("run");
        when(habitService.update(eq("u1"), eq("h1"), any(UpdateHabitRequest.class))).thenReturn(habit);

        mockMvc.perform(put("/api/habits/h1").header("Authorization", AUTH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Correr\",\"frequency\":\"personalizada\",\"daysOfWeek\":[2,4],\"color\":\"#12B76A\",\"icon\":\"run\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Correr"))
                .andExpect(jsonPath("$.frequency").value("personalizada"))
                .andExpect(jsonPath("$.daysOfWeek[1]").value(4));
    }

    @Test
    void updateRejectsInvalidBody() throws Exception {
        mockMvc.perform(put("/api/habits/h1").header("Authorization", AUTH)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\" \"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/habits/h1").header("Authorization", AUTH)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"A\",\"color\":\"rojo\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/habits/h1").header("Authorization", AUTH)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"A\",\"frequency\":\"semanal\"}"))
                .andExpect(status().isBadRequest());
        verify(habitService, never()).update(any(), any(), any());
    }

    @Test
    void updateOfMissingHabitIsNotFound() throws Exception {
        when(habitService.update(eq("u1"), eq("x"), any(UpdateHabitRequest.class)))
                .thenThrow(new NotFoundException("Habito no encontrado"));

        mockMvc.perform(put("/api/habits/x").header("Authorization", AUTH)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"A\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateWithoutSessionIsUnauthorized() throws Exception {
        mockMvc.perform(put("/api/habits/h1").contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"A\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void statsDefaultToThirtyDays() throws Exception {
        when(habitService.stats("u1", "h1", 30)).thenReturn(new HabitStats(3, 10, 83.3, 30, 25, 30));

        mockMvc.perform(get("/api/habits/h1/stats").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStreak").value(3))
                .andExpect(jsonPath("$.bestStreak").value(10))
                .andExpect(jsonPath("$.completionRate").value(83.3))
                .andExpect(jsonPath("$.scheduledDays").value(30))
                .andExpect(jsonPath("$.completedDays").value(25))
                .andExpect(jsonPath("$.windowDays").value(30));
    }

    @Test
    void statsAcceptACustomWindow() throws Exception {
        when(habitService.stats("u1", "h1", 7)).thenReturn(new HabitStats(1, 1, 100.0, 7, 7, 7));

        mockMvc.perform(get("/api/habits/h1/stats?days=7").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.windowDays").value(7));
    }

    @Test
    void statsWithInvalidWindowIsBadRequest() throws Exception {
        when(habitService.stats("u1", "h1", 500)).thenThrow(new BusinessRuleException("El parametro days debe estar entre 1 y 365"));

        mockMvc.perform(get("/api/habits/h1/stats?days=500").header("Authorization", AUTH))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/habits/h1/stats?days=abc").header("Authorization", AUTH))
                .andExpect(status().isBadRequest());
    }

    @Test
    void statsOfMissingHabitIsNotFound() throws Exception {
        when(habitService.stats("u1", "x", 30)).thenThrow(new NotFoundException("Habito no encontrado"));

        mockMvc.perform(get("/api/habits/x/stats").header("Authorization", AUTH))
                .andExpect(status().isNotFound());
    }
}
