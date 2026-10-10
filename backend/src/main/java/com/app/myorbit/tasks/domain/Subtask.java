package com.app.myorbit.tasks.domain;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class Subtask {
    private String id;
    private String title;
    private boolean done;
    private String due;
    private List<Subtask> subtasks = new ArrayList<>();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public boolean isDone() { return done; }
    public void setDone(boolean done) { this.done = done; }
    public String getDue() { return due; }
    public void setDue(String due) { this.due = due; }
    public List<Subtask> getSubtasks() { return subtasks; }
    public void setSubtasks(List<Subtask> subtasks) { this.subtasks = subtasks == null ? new ArrayList<>() : subtasks; }

    public Optional<Subtask> findDescendant(String id) {
        for (Subtask child : subtasks) {
            if (child.getId().equals(id)) return Optional.of(child);
            Optional<Subtask> found = child.findDescendant(id);
            if (found.isPresent()) return found;
        }
        return Optional.empty();
    }

    public boolean removeDescendant(String id) {
        if (subtasks.removeIf(child -> child.getId().equals(id))) return true;
        return subtasks.stream().anyMatch(child -> child.removeDescendant(id));
    }

    /** Marca esta subtarea y todas sus hijas. */
    public void markTree(boolean done) {
        this.done = done;
        subtasks.forEach(child -> child.markTree(done));
    }

    /** Una subtarea con hijas está completa solo si todas sus hijas lo están. */
    public boolean synchronizeCompletion() {
        if (subtasks.isEmpty()) return done;
        boolean complete = subtasks.stream().map(Subtask::synchronizeCompletion).allMatch(Boolean::booleanValue);
        this.done = complete;
        return complete;
    }
}
