package com.app.myorbit.tasks.application;

import com.app.myorbit.TestcontainersConfiguration;
import com.app.myorbit.tasks.domain.Task;
import com.app.myorbit.tasks.infrastructure.TaskRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Contra un Mongo real: solo se borran las completadas de quien lo pide. */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@Testcontainers(disabledWithoutDocker = true)
class DeleteCompletedTasksIntegrationTest {
    private static final String OWNER = "completed-it-owner";
    private static final String OTHER = "completed-it-other";
    private static final List<String> IDS = List.of("it-done-1", "it-done-2", "it-pending", "it-other-done");

    @Autowired
    private TaskService service;
    @Autowired
    private TaskRepository tasks;

    @AfterEach
    void cleanUp() {
        tasks.deleteAllById(IDS);
    }

    @Test
    void shouldDeleteOnlyTheCompletedTasksOfTheUser() {
        save("it-done-1", OWNER, true);
        save("it-done-2", OWNER, true);
        save("it-pending", OWNER, false);
        save("it-other-done", OTHER, true);

        assertEquals(2, service.deleteCompleted(OWNER));

        assertEquals(List.of("it-pending"), tasks.findByUserIdOrderByIdAsc(OWNER).stream().map(Task::getId).toList());
        assertTrue(tasks.existsById("it-other-done"));
        assertEquals(0, service.deleteCompleted(OWNER));
    }

    private void save(String id, String userId, boolean done) {
        Task task = new Task();
        task.setId(id);
        task.setUserId(userId);
        task.setTitle(id);
        task.setDone(done);
        tasks.save(task);
    }
}
