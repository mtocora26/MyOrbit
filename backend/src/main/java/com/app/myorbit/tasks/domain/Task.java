package com.app.myorbit.tasks.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
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
    /** Materia a la que pertenece la tarea (opcional); null si no está vinculada a ninguna. */
    private String subjectId;
    private boolean done;
    private List<Subtask> subtasks = new ArrayList<>();
    /**
     * Momento lógico del último cambio. Si el cambio se hizo sin conexión es el instante en que el usuario lo hizo
     * (no cuando llegó al servidor); null en tareas anteriores a este campo.
     */
    private Instant updatedAt;
    /** Cuándo pasó a completada; null si está pendiente o se completó antes de que existiera este campo. */
    private Instant completedAt;

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

    public String getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(String subjectId) {
        this.subjectId = subjectId;
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

    public Instant getCompletedAt() { return completedAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

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

    /** Marca la tarea y todo su árbol de subtareas; {@code at} es el momento en que se hizo el cambio. */
    public void markAll(boolean done, Instant at) {
        changeDone(done, at);
        subtasks.forEach(subtask -> subtask.markTree(done));
    }

    /** La tarea con subtareas está completa solo si todas lo están. */
    public void synchronizeCompletion(Instant at) {
        changeDone(!subtasks.isEmpty()
                && subtasks.stream().map(Subtask::synchronizeCompletion).allMatch(Boolean::booleanValue), at);
    }

    /** Vuelve a quedar pendiente (p. ej. al agregarle una subtarea). */
    public void reopen() {
        changeDone(false, null);
    }

    /** La fecha de completado se fija solo al pasar de pendiente a completada: repetir la marca no la mueve. */
    private void changeDone(boolean value, Instant at) {
        if (!value) completedAt = null;
        else if (!done) completedAt = at;
        done = value;
    }
}
