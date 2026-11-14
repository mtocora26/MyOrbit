package com.app.myorbit.habits.api;

import com.app.myorbit.habits.application.HabitService;
import com.app.myorbit.habits.domain.Habit;
import com.app.myorbit.habits.domain.HabitFrequency;
import com.app.myorbit.habits.domain.HabitStats;
import com.app.myorbit.habits.domain.MonthlyProgress;
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
    void summaryReturnsStatsAndTheGoalOfEveryHabitInOneRequest() throws Exception {
        when(habitService.summaries("u1", 30, 6)).thenReturn(List.of(
                new HabitService.HabitSummary("h1", new HabitStats(3, 10, 83.3, 30, 25, 30),
                        new HabitService.MonthlyGoalReport(80, new MonthlyProgress("2026-10", 20, 12, 16, 4, 11, 60.0, false, true), List.of())),
                new HabitService.HabitSummary("h2", new HabitStats(0, 1, 10.0, 30, 3, 30), null)));

        mockMvc.perform(get("/api/habits/summary").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].habitId").value("h1"))
                .andExpect(jsonPath("$[0].stats.currentStreak").value(3))
                .andExpect(jsonPath("$[0].monthlyGoal.goal").value(80))
                .andExpect(jsonPath("$[1].habitId").value("h2"))
                .andExpect(jsonPath("$[1].monthlyGoal").doesNotExist());
    }

    @Test
    void summaryAcceptsCustomWindowsAndRejectsInvalidOnes() throws Exception {
        when(habitService.summaries("u1", 7, 3)).thenReturn(List.of());
        when(habitService.summaries("u1", 500, 6)).thenThrow(new BusinessRuleException("El parametro days debe estar entre 1 y 365"));

        mockMvc.perform(get("/api/habits/summary?days=7&months=3").header("Authorization", AUTH))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/habits/summary?days=500").header("Authorization", AUTH))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/habits/summary?days=abc").header("Authorization", AUTH))
                .andExpect(status().isBadRequest());
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

    @Test
    void monthlyGoalReturnsTheCurrentMonthAndHistory() throws Exception {
        MonthlyProgress current = new MonthlyProgress("2026-10", 31, 8, 25, 17, 22, 25.8, false, true);
        MonthlyProgress september = new MonthlyProgress("2026-09", 30, 28, 24, 0, 0, 93.3, true, true);
        when(habitService.monthlyGoal("u1", "h1", 6)).thenReturn(new HabitService.MonthlyGoalReport(80, current, List.of(september)));

        mockMvc.perform(get("/api/habits/h1/monthly-goal").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.goal").value(80))
                .andExpect(jsonPath("$.current.month").value("2026-10"))
                .andExpect(jsonPath("$.current.remainingToGoal").value(17))
                .andExpect(jsonPath("$.current.reachable").value(true))
                .andExpect(jsonPath("$.history[0].month").value("2026-09"))
                .andExpect(jsonPath("$.history[0].approved").value(true));
    }

    @Test
    void monthlyGoalWithoutGoalIsBadRequest() throws Exception {
        when(habitService.monthlyGoal("u1", "h1", 6)).thenThrow(new BusinessRuleException("El habito no tiene una meta mensual"));

        mockMvc.perform(get("/api/habits/h1/monthly-goal").header("Authorization", AUTH))
                .andExpect(status().isBadRequest());
    }

    @Test
    void creatingAHabitRejectsAnOutOfRangeMonthlyGoal() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/habits").header("Authorization", AUTH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Leer\",\"monthlyGoal\":101}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/habits").header("Authorization", AUTH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Leer\",\"monthlyGoal\":0}"))
                .andExpect(status().isBadRequest());
    }
}
