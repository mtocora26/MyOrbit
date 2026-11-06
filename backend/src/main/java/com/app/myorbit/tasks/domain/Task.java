package com.app.myorbit.tasks.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Document(collection = "tasks")
public class Task {
    @Id
    private String id;
    private String userId;
    private String title;
    private LocalDateTime due;
    private Priority priority;
    private String categoryId;
    private boolean done;
    private List<Subtask> subtasks = new ArrayList<>();

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public LocalDateTime getDue() {
        return due;
    }

    public void setDue(LocalDateTime due) {
        this.due = due;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }

    public String getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(String categoryId) {
        this.categoryId = categoryId;
    }

    public boolean isDone() {
        return done;
    }

    public void setDone(boolean done) {
        this.done = done;
    }

    public List<Subtask> getSubtasks() { return subtasks; }
    public void setSubtasks(List<Subtask> subtasks) { this.subtasks = subtasks == null ? new ArrayList<>() : subtasks; }

    public Optional<Subtask> findSubtask(String id) {
        for (Subtask subtask : subtasks) {
            if (subtask.getId().equals(id)) return Optional.of(subtask);
            Optional<Subtask> found = subtask.findDescendant(id);
            if (found.isPresent()) return found;
        }
        return Optional.empty();
    }

    public boolean removeSubtask(String id) {
        if (subtasks.removeIf(subtask -> subtask.getId().equals(id))) return true;
        return subtasks.stream().anyMatch(subtask -> subtask.removeDescendant(id));
    }

    /** Marca la tarea y todo su árbol de subtareas. */
    public void markAll(boolean done) {
        this.done = done;
        subtasks.forEach(subtask -> subtask.markTree(done));
    }

    /** La tarea con subtareas está completa solo si todas lo están. */
    public void synchronizeCompletion() {
        this.done = !subtasks.isEmpty()
                && subtasks.stream().map(Subtask::synchronizeCompletion).allMatch(Boolean::booleanValue);
    }
}
