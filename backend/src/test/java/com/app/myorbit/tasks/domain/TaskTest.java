package com.app.myorbit.tasks.domain;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TaskTest {
    private Task task;
    private Subtask parent;
    private Subtask child;

    @BeforeEach
    void setUp() {
        child = subtask("child");
        parent = subtask("parent");
        parent.getSubtasks().add(child);
        task = new Task();
        task.getSubtasks().add(parent);
    }

    private Subtask subtask(String id) {
        Subtask subtask = new Subtask();
        subtask.setId(id);
        return subtask;
    }

    @Test
    void findSubtaskLooksInNestedLevels() {
        assertEquals(child, task.findSubtask("child").orElseThrow());
        assertTrue(task.findSubtask("missing").isEmpty());
    }

    @Test
    void removeSubtaskRemovesNestedSubtask() {
        assertTrue(task.removeSubtask("child"));
        assertTrue(parent.getSubtasks().isEmpty());
        assertFalse(task.removeSubtask("child"));
    }

    @Test
    void markAllCascadesToWholeTree() {
        task.markAll(true);

        assertTrue(task.isDone());
        assertTrue(parent.isDone());
        assertTrue(child.isDone());
    }

    @Test
    void synchronizeCompletionIsDoneOnlyWhenAllLeavesAreDone() {
        child.setDone(true);
        task.synchronizeCompletion();
        assertTrue(task.isDone());
        assertTrue(parent.isDone());

        child.setDone(false);
        task.synchronizeCompletion();
        assertFalse(task.isDone());
        assertFalse(parent.isDone());
    }

    @Test
    void taskWithoutSubtasksIsNotDoneAfterSynchronize() {
        Task empty = new Task();
        empty.setDone(true);

        empty.synchronizeCompletion();

        assertFalse(empty.isDone());
    }
}
