package com.app.myorbit.tasks.api;

import com.app.myorbit.shared.error.NotFoundException;
import com.app.myorbit.shared.error.UnauthorizedException;
import com.app.myorbit.tasks.application.TaskFilter;
import com.app.myorbit.tasks.application.TaskService;
import com.app.myorbit.tasks.domain.Priority;
import com.app.myorbit.tasks.domain.Task;
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
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TaskController.class)
class TaskSubjectApiTest {
    private static final String AUTH = "Bearer token-u1";

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
        when(currentUserProvider.requireUser(null)).thenThrow(new UnauthorizedException("Sesion invalida"));
    }

    private Task task(String subjectId) {
        Task task = new Task();
        task.setId("t1");
        task.setUserId("u1");
        task.setTitle("Taller 1");
        task.setPriority(Priority.MEDIUM);
        task.setSubjectId(subjectId);
        return task;
    }

    @Test
    void responseExposesTheSubjectId() throws Exception {
        when(taskService.listByUser(eq("u1"), any(TaskFilter.class))).thenReturn(List.of(task("redes"), task(null)));

        mockMvc.perform(get("/api/tasks").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].subjectId").value("redes"))
                .andExpect(jsonPath("$[1].subjectId").doesNotExist());
    }

    @Test
    void listPassesTheSubjectFilter() throws Exception {
        when(taskService.listByUser(eq("u1"), any(TaskFilter.class))).thenReturn(List.of(task("redes")));

        mockMvc.perform(get("/api/tasks?subjectId=redes&done=false").header("Authorization", AUTH)).andExpect(status().isOk());

        ArgumentCaptor<TaskFilter> captor = ArgumentCaptor.forClass(TaskFilter.class);
        verify(taskService).listByUser(eq("u1"), captor.capture());
        assertEquals("redes", captor.getValue().subjectId());
        assertEquals(false, captor.getValue().done());
    }

    @Test
    void listWithoutSubjectFilterHasNone() throws Exception {
        when(taskService.listByUser(eq("u1"), any(TaskFilter.class))).thenReturn(List.of());

        mockMvc.perform(get("/api/tasks").header("Authorization", AUTH)).andExpect(status().isOk());

        ArgumentCaptor<TaskFilter> captor = ArgumentCaptor.forClass(TaskFilter.class);
        verify(taskService).listByUser(eq("u1"), captor.capture());
        assertNull(captor.getValue().subjectId());
    }

    @Test
    void createAcceptsASubjectId() throws Exception {
        when(taskService.create(eq("u1"), any(CreateTaskRequest.class))).thenReturn(task("redes"));

        mockMvc.perform(post("/api/tasks").header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Taller 1\",\"subjectId\":\"redes\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.subjectId").value("redes"));

        ArgumentCaptor<CreateTaskRequest> captor = ArgumentCaptor.forClass(CreateTaskRequest.class);
        verify(taskService).create(eq("u1"), captor.capture());
        assertEquals("redes", captor.getValue().subjectId());
    }

    @Test
    void updateDistinguishesAbsentFromEmptySubjectId() throws Exception {
        when(taskService.update(eq("u1"), eq("t1"), any(UpdateTaskRequest.class))).thenReturn(task(null));

        mockMvc.perform(put("/api/tasks/t1").header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Taller 1\"}")).andExpect(status().isOk());
        mockMvc.perform(put("/api/tasks/t1").header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                .content("{\"subjectId\":\"\"}")).andExpect(status().isOk());

        ArgumentCaptor<UpdateTaskRequest> captor = ArgumentCaptor.forClass(UpdateTaskRequest.class);
        verify(taskService, org.mockito.Mockito.times(2)).update(eq("u1"), eq("t1"), captor.capture());
        assertNull(captor.getAllValues().get(0).subjectId());
        assertEquals("", captor.getAllValues().get(1).subjectId());
    }

    @Test
    void aMissingSubjectIsNotFound() throws Exception {
        when(taskService.create(eq("u1"), any(CreateTaskRequest.class))).thenThrow(new NotFoundException("Materia no encontrada"));

        mockMvc.perform(post("/api/tasks").header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Taller 1\",\"subjectId\":\"ajena\"}"))
                .andExpect(status().isNotFound());
    }
}
