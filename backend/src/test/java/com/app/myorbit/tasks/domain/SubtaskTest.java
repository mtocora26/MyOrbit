package com.app.myorbit.tasks.domain;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Árbol: root ── a ── a1 ── a1x ; root ── b */
class SubtaskTest {
    private Subtask root;
    private Subtask a;
    private Subtask a1;
    private Subtask a1x;
    private Subtask b;

    @BeforeEach
    void setUp() {
        a1x = subtask("a1x");
        a1 = subtask("a1", a1x);
        a = subtask("a", a1);
        b = subtask("b");
        root = subtask("root", a, b);
    }

    private Subtask subtask(String id, Subtask... children) {
        Subtask subtask = new Subtask();
        subtask.setId(id);
        for (Subtask child : children) subtask.getSubtasks().add(child);
        return subtask;
    }

    @Test
    void newSubtaskIsPendingWithoutChildrenOrDueDate() {
        Subtask fresh = new Subtask();

        assertFalse(fresh.isDone());
        assertTrue(fresh.getSubtasks().isEmpty());
        assertEquals(null, fresh.getDue());
    }

    @Test
    void setSubtasksWithNullFallsBackToAnEmptyList() {
        a.setSubtasks(null);

        assertNotNull(a.getSubtasks());
        assertTrue(a.getSubtasks().isEmpty());
    }

    @Test
    void findDescendantReachesEveryLevel() {
        assertEquals(a, root.findDescendant("a").orElseThrow());
        assertEquals(a1, root.findDescendant("a1").orElseThrow());
        assertEquals(a1x, root.findDescendant("a1x").orElseThrow());
        assertEquals(b, root.findDescendant("b").orElseThrow());
    }

    @Test
    void findDescendantDoesNotReturnItselfNorMissingIds() {
        assertTrue(root.findDescendant("root").isEmpty());
        assertTrue(root.findDescendant("zzz").isEmpty());
        assertTrue(b.findDescendant("a").isEmpty());
    }

    @Test
    void removeDescendantRemovesAWholeBranch() {
        assertTrue(root.removeDescendant("a"));

        assertTrue(root.findDescendant("a").isEmpty());
        assertTrue(root.findDescendant("a1x").isEmpty());
        assertEquals(1, root.getSubtasks().size());
    }

    @Test
    void removeDescendantRemovesADeepLeafAndKeepsSiblings() {
        assertTrue(root.removeDescendant("a1x"));

        assertTrue(a1.getSubtasks().isEmpty());
        assertEquals(a1, root.findDescendant("a1").orElseThrow());
        assertEquals(b, root.findDescendant("b").orElseThrow());
    }

    @Test
    void removeDescendantReportsMissingIdsWithoutChangingTheTree() {
        assertFalse(root.removeDescendant("zzz"));
        assertFalse(root.removeDescendant("root"));

        assertEquals(2, root.getSubtasks().size());
        assertTrue(root.findDescendant("a1x").isPresent());
    }

    @Test
    void markTreeCascadesDownOnly() {
        a.markTree(true);

        assertTrue(a.isDone() && a1.isDone() && a1x.isDone());
        assertFalse(root.isDone());
        assertFalse(b.isDone());
    }

    @Test
    void markTreeCanReopenAFinishedBranch() {
        root.markTree(true);
        a.markTree(false);

        assertFalse(a.isDone() || a1.isDone() || a1x.isDone());
        assertTrue(root.isDone());
        assertTrue(b.isDone());
    }

    @Test
    void leafKeepsItsOwnStateOnSynchronize() {
        b.setDone(true);

        assertTrue(b.synchronizeCompletion());
        assertTrue(b.isDone());
        assertFalse(a1x.synchronizeCompletion());
    }

    @Test
    void synchronizePropagatesCompletionUpAllLevels() {
        a1x.setDone(true);
        b.setDone(true);

        assertTrue(root.synchronizeCompletion());
        assertTrue(a.isDone());
        assertTrue(a1.isDone());
    }

    @Test
    void synchronizeLeavesAncestorsPendingWhileAnyLeafIsPending() {
        a1x.setDone(true);

        assertFalse(root.synchronizeCompletion()); // b sigue pendiente
        assertTrue(a.isDone());
        assertFalse(root.isDone());
    }

    @Test
    void synchronizeOverridesAStaleParentFlag() {
        a.setDone(true); // marcada a mano, pero su hoja está pendiente
        a1.setDone(true);

        assertFalse(a.synchronizeCompletion());
        assertFalse(a.isDone());
        assertFalse(a1.isDone());
    }
}
