package com.app.myorbit.tasks.application;

import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.NotFoundException;
import com.app.myorbit.tasks.api.CreateSubtaskRequest;
import com.app.myorbit.tasks.api.CreateTaskRequest;
import com.app.myorbit.tasks.api.UpdateSubtaskRequest;
import com.app.myorbit.tasks.api.UpdateSubtaskStatusRequest;
import com.app.myorbit.tasks.api.UpdateTaskRequest;
import com.app.myorbit.tasks.api.UpdateTaskStatusRequest;
import com.app.myorbit.tasks.domain.Priority;
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
        task.setPriority(defaultText(request.priority(), Priority.MEDIUM.value()));
        task.setTag(defaultText(request.tag(), "Personal"));
        task.setDone(false);
        return taskRepository.save(task);
    }

    public Task updateStatus(String userId, String id, UpdateTaskStatusRequest request) {
        Task task = getOwned(userId, id);
        task.markAll(request.isDone());
        return taskRepository.save(task);
    }

    public Task addSubtask(String userId, String taskId, CreateSubtaskRequest request) {
        Task task = getOwned(userId, taskId);
        requireSubtaskTitle(request);
        task.getSubtasks().add(newSubtask(request));
        task.setDone(false);
        return taskRepository.save(task);
    }

    public Task addNestedSubtask(String userId, String taskId, String parentSubtaskId, CreateSubtaskRequest request) {
        Task task = getOwned(userId, taskId);
        requireSubtaskTitle(request);
        Subtask parent = task.findSubtask(parentSubtaskId)
                .orElseThrow(() -> new BusinessRuleException("La subtarea padre no existe"));
        parent.getSubtasks().add(newSubtask(request));
        task.synchronizeCompletion();
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
        subtask.markTree(request.done());
        task.synchronizeCompletion();
        return taskRepository.save(task);
    }

    public Task deleteSubtask(String userId, String taskId, String subtaskId) {
        Task task = getOwned(userId, taskId);
        if (!task.removeSubtask(subtaskId)) {
            throw new NotFoundException("Subtarea no encontrada");
        }
        task.synchronizeCompletion();
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
        t1.setPriority(Priority.HIGH.value());
        t1.setTag("Universidad");
        t1.setDone(false);

        Task t2 = new Task();
        t2.setId("seed-2");
        t2.setUserId("demo-user");
        t2.setTitle("Comprar materiales de cartelera");
        t2.setDue("Hoy 6:00 PM");
        t2.setPriority(Priority.MEDIUM.value());
        t2.setTag("Proyecto");
        t2.setDone(false);

        taskRepository.saveAll(List.of(t1, t2));
    }

    private void requireSubtaskTitle(CreateSubtaskRequest request) {
        if (request.title() == null || request.title().isBlank()) {
            throw new BusinessRuleException("El titulo de la subtarea es obligatorio");
        }
    }

    private Subtask newSubtask(CreateSubtaskRequest request) {
        Subtask subtask = new Subtask();
        subtask.setId(UUID.randomUUID().toString());
        subtask.setTitle(request.title().trim());
        subtask.setDone(false);
        subtask.setDue(blankToNull(request.due()));
        return subtask;
    }

    private Subtask requireSubtask(Task task, String subtaskId) {
        return task.findSubtask(subtaskId).orElseThrow(() -> new NotFoundException("Subtarea no encontrada"));
    }

    private String defaultText(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value;
    }

    private String defaultPriority(String value, String fallback) {
        return Priority.fromValue(value).map(Priority::value).orElse(fallback);
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
