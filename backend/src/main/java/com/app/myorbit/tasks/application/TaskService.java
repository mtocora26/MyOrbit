package com.app.myorbit.tasks.application;

import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.NotFoundException;
import com.app.myorbit.tasks.api.CreateSubtaskRequest;
import com.app.myorbit.tasks.api.CreateTaskRequest;
import com.app.myorbit.tasks.api.UpdateSubtaskRequest;
import com.app.myorbit.tasks.api.UpdateSubtaskStatusRequest;
import com.app.myorbit.tasks.api.UpdateTaskRequest;
import com.app.myorbit.tasks.api.UpdateTaskStatusRequest;
import com.app.myorbit.tasks.domain.Subtask;
import com.app.myorbit.tasks.domain.Task;
import com.app.myorbit.tasks.infrastructure.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
        seed();
    }

    public List<Task> listByUser(String userId) {
        return taskRepository.findByUserIdOrderByIdAsc(userId);
    }

    public Task getOwned(String userId, String id) {
        return taskRepository.findById(id)
                .filter(task -> task.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("Tarea no encontrada"));
    }

    public Task create(String userId, CreateTaskRequest request) {
        Task task = new Task();
        task.setId(UUID.randomUUID().toString());
        task.setUserId(userId);
        task.setTitle(request.title());
        task.setDue(defaultText(request.due(), "Sin fecha"));
        task.setPriority(defaultText(request.priority(), "media"));
        task.setTag(defaultText(request.tag(), "Personal"));
        task.setDone(false);
        return taskRepository.save(task);
    }

    public Task updateStatus(String userId, String id, UpdateTaskStatusRequest request) {
        Task task = getOwned(userId, id);
        task.setDone(request.isDone());
        if (!task.getSubtasks().isEmpty()) {
            task.getSubtasks().forEach(subtask -> markSubtaskTree(subtask, request.isDone()));
        }
        return taskRepository.save(task);
    }

    public Task addSubtask(String userId, String taskId, CreateSubtaskRequest request) {
        Task task = getOwned(userId, taskId);
        requireSubtaskTitle(request);
        Subtask subtask = new Subtask();
        subtask.setId(UUID.randomUUID().toString());
        subtask.setTitle(request.title().trim());
        subtask.setDone(false);
        subtask.setDue(blankToNull(request.due()));
        task.getSubtasks().add(subtask);
        task.setDone(false);
        return taskRepository.save(task);
    }

    public Task addNestedSubtask(String userId, String taskId, String parentSubtaskId, CreateSubtaskRequest request) {
        Task task = getOwned(userId, taskId);
        requireSubtaskTitle(request);
        Subtask parent = findSubtask(task.getSubtasks(), parentSubtaskId);
        if (parent == null) throw new BusinessRuleException("La subtarea padre no existe");
        Subtask subtask = new Subtask();
        subtask.setId(UUID.randomUUID().toString());
        subtask.setTitle(request.title().trim());
        subtask.setDone(false);
        subtask.setDue(blankToNull(request.due()));
        parent.getSubtasks().add(subtask);
        synchronizeTaskCompletion(task);
        return taskRepository.save(task);
    }

    public Task updateSubtask(String userId, String taskId, String subtaskId, UpdateSubtaskRequest request) {
        Task task = getOwned(userId, taskId);
        Subtask subtask = requireSubtask(task, subtaskId);
        if (request.title() != null && !request.title().isBlank()) {
            subtask.setTitle(request.title().trim());
        }
        subtask.setDue(blankToNull(request.due()));
        return taskRepository.save(task);
    }

    public Task updateSubtaskStatus(String userId, String taskId, String subtaskId, UpdateSubtaskStatusRequest request) {
        Task task = getOwned(userId, taskId);
        Subtask subtask = requireSubtask(task, subtaskId);
        markSubtaskTree(subtask, request.done());
        synchronizeTaskCompletion(task);
        return taskRepository.save(task);
    }

    public Task deleteSubtask(String userId, String taskId, String subtaskId) {
        Task task = getOwned(userId, taskId);
        if (!removeSubtask(task.getSubtasks(), subtaskId)) {
            throw new NotFoundException("Subtarea no encontrada");
        }
        synchronizeTaskCompletion(task);
        return taskRepository.save(task);
    }

    public Task update(String userId, String id, UpdateTaskRequest request) {
        Task task = getOwned(userId, id);

        task.setTitle(defaultText(request.title(), task.getTitle()));
        task.setDue(defaultText(request.due(), task.getDue()));
        task.setPriority(defaultPriority(request.priority(), task.getPriority()));
        task.setTag(defaultTag(request.tag(), task.getTag()));
        return taskRepository.save(task);
    }

    public boolean delete(String userId, String id) {
        getOwned(userId, id);
        taskRepository.deleteById(id);
        return true;
    }

    private void seed() {
        if (taskRepository.count() > 0) {
            return;
        }

        Task t1 = new Task();
        t1.setId("seed-1");
        t1.setUserId("demo-user");
        t1.setTitle("Entregar proyecto de Moviles");
        t1.setDue("Hoy 11:59 PM");
        t1.setPriority("alta");
        t1.setTag("Universidad");
        t1.setDone(false);

        Task t2 = new Task();
        t2.setId("seed-2");
        t2.setUserId("demo-user");
        t2.setTitle("Comprar materiales de cartelera");
        t2.setDue("Hoy 6:00 PM");
        t2.setPriority("media");
        t2.setTag("Proyecto");
        t2.setDone(false);

        taskRepository.saveAll(List.of(t1, t2));
    }

    private void requireSubtaskTitle(CreateSubtaskRequest request) {
        if (request.title() == null || request.title().isBlank()) {
            throw new BusinessRuleException("El titulo de la subtarea es obligatorio");
        }
    }

    private Subtask requireSubtask(Task task, String subtaskId) {
        Subtask subtask = findSubtask(task.getSubtasks(), subtaskId);
        if (subtask == null) throw new NotFoundException("Subtarea no encontrada");
        return subtask;
    }

    private Subtask findSubtask(List<Subtask> subtasks, String id) {
        for (Subtask subtask : subtasks) {
            if (subtask.getId().equals(id)) return subtask;
            Subtask found = findSubtask(subtask.getSubtasks(), id);
            if (found != null) return found;
        }
        return null;
    }

    private boolean removeSubtask(List<Subtask> subtasks, String id) {
        if (subtasks.removeIf(subtask -> subtask.getId().equals(id))) return true;
        for (Subtask subtask : subtasks) {
            if (removeSubtask(subtask.getSubtasks(), id)) return true;
        }
        return false;
    }

    private void markSubtaskTree(Subtask subtask, boolean done) {
        subtask.setDone(done);
        subtask.getSubtasks().forEach(child -> markSubtaskTree(child, done));
    }

    private boolean synchronizeSubtaskCompletion(Subtask subtask) {
        if (subtask.getSubtasks().isEmpty()) return subtask.isDone();
        boolean complete = subtask.getSubtasks().stream().map(this::synchronizeSubtaskCompletion).allMatch(Boolean::booleanValue);
        subtask.setDone(complete);
        return complete;
    }

    private void synchronizeTaskCompletion(Task task) {
        task.setDone(!task.getSubtasks().isEmpty() && task.getSubtasks().stream().map(this::synchronizeSubtaskCompletion).allMatch(Boolean::booleanValue));
    }

    private String defaultText(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value;
    }

    private String defaultPriority(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        String normalized = value.toLowerCase();
        if (normalized.equals("alta") || normalized.equals("media") || normalized.equals("baja")) {
            return normalized;
        }
        return fallback;
    }

    private String defaultTag(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
