package com.app.myorbit.tasks.application;

import com.app.myorbit.categories.application.CategoryService;
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

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final CategoryService categoryService;

    public TaskService(TaskRepository taskRepository, CategoryService categoryService) {
        this.taskRepository = taskRepository;
        this.categoryService = categoryService;
    }

    public List<Task> listByUser(String userId) {
        return listByUser(userId, TaskFilter.empty());
    }

    public List<Task> listByUser(String userId, TaskFilter filter) {
        if (filter.dueFrom() != null && filter.dueTo() != null && filter.dueFrom().isAfter(filter.dueTo())) {
            throw new BusinessRuleException("El rango de fechas no es valido: dueFrom no puede ser posterior a dueTo");
        }
        return taskRepository.findByUserIdOrderByIdAsc(userId).stream()
                .filter(filter::matches)
                .sorted(Comparator.comparing(Task::getDue, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    public Task getOwned(String userId, String id) {
        return taskRepository.findById(id)
                .filter(task -> task.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("Tarea no encontrada"));
    }

    public Task create(String userId, CreateTaskRequest request) {
        if (request.title() == null || request.title().isBlank()) {
            throw new BusinessRuleException("El titulo de la tarea es obligatorio");
        }
        Task task = new Task();
        task.setId(UUID.randomUUID().toString());
        task.setUserId(userId);
        task.setTitle(request.title().trim());
        task.setDue(DueDate.parse(request.due()));
        task.setPriority(request.priority() == null ? Priority.MEDIUM : request.priority());
        task.setCategoryId(resolveNewCategory(userId, request.categoryId()));
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
        // due: null = no cambiar; cadena vacia = quitar la fecha.
        if (request.due() != null) {
            subtask.setDue(DueDate.parse(request.due()));
        }
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

        task.setTitle(request.title() == null || request.title().isBlank() ? task.getTitle() : request.title().trim());
        // due: null = no cambiar; cadena vacia = quitar la fecha.
        if (request.due() != null) task.setDue(DueDate.parse(request.due()));
        if (request.priority() != null) task.setPriority(request.priority());
        // categoryId: null = no cambiar; cadena vacia = quitar la categoría.
        if (request.categoryId() != null) task.setCategoryId(resolveNewCategory(userId, request.categoryId()));
        return taskRepository.save(task);
    }

    public boolean delete(String userId, String id) {
        getOwned(userId, id);
        taskRepository.deleteById(id);
        return true;
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
        subtask.setDue(DueDate.parse(request.due()));
        return subtask;
    }

    private Subtask requireSubtask(Task task, String subtaskId) {
        return task.findSubtask(subtaskId).orElseThrow(() -> new NotFoundException("Subtarea no encontrada"));
    }

    private String resolveNewCategory(String userId, String categoryId) {
        if (categoryId == null || categoryId.isBlank()) return null;
        return categoryService.getOwned(userId, categoryId.trim()).getId();
    }
}
