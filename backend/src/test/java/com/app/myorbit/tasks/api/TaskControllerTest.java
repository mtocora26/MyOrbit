package com.app.myorbit.tasks.api;

import com.app.myorbit.tasks.application.TaskFilter;
import com.app.myorbit.tasks.application.TaskService;
import com.app.myorbit.tasks.domain.Priority;
import com.app.myorbit.tasks.domain.Task;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TaskController.class)
class TaskControllerTest {
    private static final String AUTH = "******";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TaskService taskService;

    @MockitoBean
    private CurrentUserProvider currentUserProvider;

    @BeforeEach
    void authenticate() {
        User user = new User();
        user.setId("u1");
        when(currentUserProvider.requireUser(AUTH)).thenReturn(user);
        when(currentUserProvider.requireUser(null)).thenThrow(new com.app.myorbit.shared.error.UnauthorizedException("Sesion invalida"));
    }

    private Task task() {
        Task task = new Task();
        task.setId("t1");
        task.setUserId("u1");
        task.setTitle("Tarea");
        task.setCategoryId("c1");
        task.setPriority(Priority.HIGH);
        task.setDone(false);
        return task;
    }

    @Test
    void listWithoutFiltersResponseCategoryId() throws Exception {
        when(taskService.listByUser(eq("u1"), eq(TaskFilter.empty()))).thenReturn(List.of(task()));

        mockMvc.perform(get("/api/tasks").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("t1"))
                .andExpect(jsonPath("$[0].categoryId").value("c1"))
                .andExpect(jsonPath("$[0].priority").value("alta"));
    }

    @Test
    void listPassesCombinedFiltersToService() throws Exception {
        TaskFilter filter = new TaskFilter(false,
                LocalDateTime.parse("2026-10-01T00:00"),
                LocalDateTime.parse("2026-10-31T23:59"), Priority.HIGH, "c1", false);
        when(taskService.listByUser(eq("u1"), eq(filter))).thenReturn(List.of(task()));

        mockMvc.perform(get("/api/tasks").header("Authorization", AUTH)
                        .param("done", "false")
                        .param("dueFrom", "2026-10-01T00:00")
                        .param("dueTo", "2026-10-31T23:59")
                        .param("priority", "alta")
                        .param("categoryId", "c1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("t1"));
    }

    @Test
    void listAcceptsUncategorizedFilter() throws Exception {
        when(taskService.listByUser(eq("u1"), eq(new TaskFilter(null, null, null, null, null, true))))
                .thenReturn(List.of(task()));

        mockMvc.perform(get("/api/tasks").header("Authorization", AUTH).param("uncategorized", "true"))
                .andExpect(status().isOk());
    }

    @Test
    void deleteCompletedReportsHowManyWereDeleted() throws Exception {
        when(taskService.deleteCompleted("u1")).thenReturn(3L);

        mockMvc.perform(delete("/api/tasks/completed").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deleted").value(3));
    }

    @Test
    void deleteCompletedRequiresASession() throws Exception {
        mockMvc.perform(delete("/api/tasks/completed")).andExpect(status().isUnauthorized());
        org.mockito.Mockito.verify(taskService, org.mockito.Mockito.never()).deleteCompleted(any());
    }

    @Test
    void listRejectsInvalidPriority() throws Exception {
        mockMvc.perform(get("/api/tasks").header("Authorization", AUTH).param("priority", "urgente"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listRejectsInvalidDate() throws Exception {
        mockMvc.perform(get("/api/tasks").header("Authorization", AUTH).param("dueFrom", "mañana"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listRejectsInvertedDateRange() throws Exception {
        when(taskService.listByUser(eq("u1"), eq(new TaskFilter(null,
                LocalDateTime.parse("2026-12-01T00:00"),
                LocalDateTime.parse("2026-10-01T00:00"), null, null, false))))
                .thenThrow(new com.app.myorbit.shared.error.BusinessRuleException("El rango de fechas no es valido"));

        mockMvc.perform(get("/api/tasks").header("Authorization", AUTH)
                        .param("dueFrom", "2026-12-01T00:00")
                        .param("dueTo", "2026-10-01T00:00"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void anOfflineChangeOlderThanTheSavedOneAnswers409() throws Exception {
        when(taskService.updateStatus(eq("u1"), eq("t1"), any()))
                .thenThrow(new com.app.myorbit.shared.error.ConflictException("La tarea cambió en otro dispositivo"));

        mockMvc.perform(patch("/api/tasks/t1/status").header("Authorization", AUTH)
                        .contentType("application/json")
                        .content("{\"done\":true,\"clientTime\":\"2026-11-21T14:00:00Z\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("La tarea cambió en otro dispositivo"));
    }

    @Test
    void createAcceptsAnIdChosenByTheClientAndRejectsOnesThatAreNotUuids() throws Exception {
        when(taskService.create(eq("u1"), any())).thenReturn(task());

        mockMvc.perform(post("/api/tasks").header("Authorization", AUTH).contentType("application/json")
                        .content("{\"title\":\"Estudiar\",\"id\":\"3f2b8c1e-5d4a-4b7e-9c10-0a1b2c3d4e5f\"}"))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/tasks").header("Authorization", AUTH).contentType("application/json")
                        .content("{\"title\":\"Estudiar\",\"id\":\"no-es-un-uuid\"}"))
                .andExpect(status().isBadRequest());
    }
}
