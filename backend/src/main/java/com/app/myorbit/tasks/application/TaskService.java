package com.app.myorbit.tasks.application;

import com.app.myorbit.shared.time.DueDate;
import com.app.myorbit.categories.application.CategoryService;
import com.app.myorbit.categories.domain.CategoryDeletedEvent;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.NotFoundException;
import com.app.myorbit.tasks.api.CreateSubtaskRequest;
import com.app.myorbit.tasks.api.CreateTaskRequest;
import com.app.myorbit.tasks.api.UpdateSubtaskRequest;
import com.app.myorbit.tasks.api.UpdateSubtaskStatusRequest;
import com.app.myorbit.tasks.api.UpdateTaskRequest;
import com.app.myorbit.tasks.api.UpdateTaskStatusRequest;
import com.app.myorbit.tasks.domain.Priority;
import com.app.myorbit.tasks.domain.TaskCompletedEvent;
import com.app.myorbit.tasks.domain.TaskCreatedEvent;
import com.app.myorbit.tasks.domain.TaskDueSoonEvent;
import com.app.myorbit.tasks.domain.Subtask;
import com.app.myorbit.tasks.domain.Task;
import com.app.myorbit.tasks.infrastructure.TaskRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final CategoryService categoryService;
    private final ApplicationEventPublisher events;

    public TaskService(TaskRepository taskRepository, CategoryService categoryService, ApplicationEventPublisher events) {
        this.taskRepository = taskRepository;
        this.categoryService = categoryService;
        this.events = events;
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

    /** Al borrar una categoría, sus tareas se conservan pero quedan sin categoría. */
    @EventListener
    public void onCategoryDeleted(CategoryDeletedEvent event) {
        List<Task> affected = taskRepository.findByUserIdAndCategoryId(event.userId(), event.categoryId());
        affected.forEach(task -> task.setCategoryId(null));
        if (!affected.isEmpty()) taskRepository.saveAll(affected);
    }

    /**
     * Publica un {@link TaskDueSoonEvent} por cada tarea pendiente del usuario con vencimiento en
     * [{@code from}, {@code to}] (hora local del usuario, como se guarda {@code due}). Lo invoca el recordatorio programado.
     *
     * @return cantidad de tareas notificadas
     */
    public int publishDueSoon(String userId, LocalDateTime from, LocalDateTime to) {
        List<Task> dueSoon = taskRepository.findByUserIdAndDoneFalseAndDueBetween(userId, from, to);
        dueSoon.forEach(task -> events.publishEvent(new TaskDueSoonEvent(task.getUserId(), task.getId(), task.getTitle(), task.getDue())));
        return dueSoon.size();
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
        Task saved = taskRepository.save(task);
        events.publishEvent(new TaskCreatedEvent(userId, saved.getId(), saved.getTitle(), saved.getDue()));
        return saved;
    }

    public Task updateStatus(String userId, String id, UpdateTaskStatusRequest request) {
        Task task = getOwned(userId, id);
        boolean wasDone = task.isDone();
        task.markAll(request.isDone());
        return saveNotifyingCompletion(task, wasDone);
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
        boolean wasDone = task.isDone();
        subtask.markTree(request.done());
        task.synchronizeCompletion();
        return saveNotifyingCompletion(task, wasDone);
    }

    public Task deleteSubtask(String userId, String taskId, String subtaskId) {
        Task task = getOwned(userId, taskId);
        boolean wasDone = task.isDone();
        if (!task.removeSubtask(subtaskId)) {
            throw new NotFoundException("Subtarea no encontrada");
        }
        task.synchronizeCompletion();
        return saveNotifyingCompletion(task, wasDone);
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

    /** Guarda la tarea y avisa a los observadores solo si acaba de pasar de pendiente a completada. */
    private Task saveNotifyingCompletion(Task task, boolean wasDone) {
        Task saved = taskRepository.save(task);
        if (!wasDone && saved.isDone()) {
            events.publishEvent(new TaskCompletedEvent(saved.getUserId(), saved.getId(), saved.getTitle()));
        }
        return saved;
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
