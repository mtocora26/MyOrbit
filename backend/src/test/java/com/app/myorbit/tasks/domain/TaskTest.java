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
    void shouldRecordWhenItWasCompleted_andKeepItWhenMarkedAgain() {
        java.time.Instant first = java.time.Instant.parse("2026-11-27T10:00:00Z");

        task.markAll(true, first);
        task.markAll(true, first.plusSeconds(60));

        assertEquals(first, task.getCompletedAt());
    }

    @Test
    void shouldForgetTheCompletionDate_whenReopened() {
        task.markAll(true, java.time.Instant.EPOCH);
        task.markAll(false, java.time.Instant.EPOCH);
        org.junit.jupiter.api.Assertions.assertNull(task.getCompletedAt());

        task.markAll(true, java.time.Instant.EPOCH);
        task.reopen();
        assertFalse(task.isDone());
        org.junit.jupiter.api.Assertions.assertNull(task.getCompletedAt());
    }

    @Test
    void shouldRecordTheDate_whenTheLastSubtaskCompletesIt() {
        java.time.Instant at = java.time.Instant.parse("2026-11-27T11:00:00Z");
        child.setDone(true);

        task.synchronizeCompletion(at);

        assertEquals(at, task.getCompletedAt());
    }

    @Test
    void shouldNotInventADate_forATaskCompletedBeforeDatesWereRecorded() {
        task.setDone(true);

        task.markAll(true, java.time.Instant.EPOCH);

        org.junit.jupiter.api.Assertions.assertNull(task.getCompletedAt());
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
        task.markAll(true, java.time.Instant.EPOCH);

        assertTrue(task.isDone());
        assertTrue(parent.isDone());
        assertTrue(child.isDone());
    }

    @Test
    void synchronizeCompletionIsDoneOnlyWhenAllLeavesAreDone() {
        child.setDone(true);
        task.synchronizeCompletion(java.time.Instant.EPOCH);
        assertTrue(task.isDone());
        assertTrue(parent.isDone());

        child.setDone(false);
        task.synchronizeCompletion(java.time.Instant.EPOCH);
        assertFalse(task.isDone());
        assertFalse(parent.isDone());
    }

    @Test
    void taskWithoutSubtasksIsNotDoneAfterSynchronize() {
        Task empty = new Task();
        empty.setDone(true);

        empty.synchronizeCompletion(java.time.Instant.EPOCH);

        assertFalse(empty.isDone());
    }

    @Test
    void findAndRemoveReturnNothingOnATaskWithoutSubtasks() {
        Task empty = new Task();

        assertTrue(empty.findSubtask("x").isEmpty());
        assertFalse(empty.removeSubtask("x"));
    }

    @Test
    void removeSubtaskRemovesATopLevelBranchWithItsDescendants() {
        assertTrue(task.removeSubtask("parent"));

        assertTrue(task.getSubtasks().isEmpty());
        assertTrue(task.findSubtask("child").isEmpty());
    }

    @Test
    void markAllCanReopenAFinishedTree() {
        task.markAll(true, java.time.Instant.EPOCH);
        task.markAll(false, java.time.Instant.EPOCH);

        assertFalse(task.isDone());
        assertFalse(parent.isDone());
        assertFalse(child.isDone());
    }

    @Test
    void synchronizeRequiresEveryBranchToBeDone() {
        Subtask sibling = subtask("sibling");
        task.getSubtasks().add(sibling);
        child.setDone(true);

        task.synchronizeCompletion(java.time.Instant.EPOCH);
        assertFalse(task.isDone());
        assertTrue(parent.isDone());

        sibling.setDone(true);
        task.synchronizeCompletion(java.time.Instant.EPOCH);
        assertTrue(task.isDone());
    }

    @Test
    void removingTheLastPendingSubtaskCompletesTheTask() {
        Subtask pending = subtask("pending");
        task.getSubtasks().add(pending);
        child.setDone(true);
        task.synchronizeCompletion(java.time.Instant.EPOCH);
        assertFalse(task.isDone());

        task.removeSubtask("pending");
        task.synchronizeCompletion(java.time.Instant.EPOCH);

        assertTrue(task.isDone());
    }

    @Test
    void setSubtasksWithNullFallsBackToAnEmptyList() {
        task.setSubtasks(null);

        assertTrue(task.getSubtasks().isEmpty());
    }
}
