package com.app.myorbit.tasks.api;

import com.app.myorbit.tasks.domain.Priority;
import com.app.myorbit.tasks.domain.Subtask;
import com.app.myorbit.tasks.domain.Task;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TaskResponseTest {
    @Test
    void mapsTaskWithNestedSubtasks() {
        Subtask child = new Subtask();
        child.setId("s2");
        child.setTitle("Hija");
        Subtask parent = new Subtask();
        parent.setId("s1");
        parent.setTitle("Padre");
        parent.setDue(java.time.LocalDateTime.parse("2026-10-20T08:30"));
        parent.getSubtasks().add(child);
        Task task = new Task();
        task.setId("t1");
        task.setUserId("u1");
        task.setTitle("Tarea");
        task.setCategoryId("c1");
        task.setPriority(Priority.HIGH);
        task.setDone(true);
        task.getSubtasks().add(parent);

        TaskResponse response = TaskResponse.from(task);

        assertEquals("t1", response.id());
        assertEquals("c1", response.categoryId());
        assertEquals(Priority.HIGH, response.priority());
        assertTrue(response.done());
        assertEquals("Padre", response.subtasks().get(0).title());
        assertEquals(java.time.LocalDateTime.parse("2026-10-20T08:30"), response.subtasks().get(0).due());
        assertEquals("s2", response.subtasks().get(0).subtasks().get(0).id());
    }
}
