package com.app.myorbit.tasks.application;

import com.app.myorbit.shared.time.DueDate;
import com.app.myorbit.academic.application.SubjectService;
import com.app.myorbit.academic.domain.SubjectDeletedEvent;
import com.app.myorbit.categories.application.CategoryService;
import com.app.myorbit.categories.domain.Category;
import com.app.myorbit.categories.domain.CategoryDeletedEvent;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.ConflictException;
import com.app.myorbit.shared.error.NotFoundException;
import com.app.myorbit.tasks.api.CreateSubtaskRequest;
import com.app.myorbit.tasks.api.CreateTaskRequest;
import com.app.myorbit.tasks.api.UpdateSubtaskRequest;
import com.app.myorbit.tasks.api.UpdateSubtaskStatusRequest;
import com.app.myorbit.tasks.api.UpdateTaskRequest;
import com.app.myorbit.tasks.api.UpdateTaskStatusRequest;
import com.app.myorbit.tasks.domain.Priority;
import com.app.myorbit.tasks.domain.TaskCreatedEvent;
import com.app.myorbit.tasks.domain.TaskDueSoonEvent;
import com.app.myorbit.tasks.domain.TaskOverdueEvent;
import com.app.myorbit.tasks.domain.Subtask;
import com.app.myorbit.tasks.domain.Task;
import com.app.myorbit.tasks.infrastructure.TaskRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class TaskService {

    static final String UNIVERSITY_CATEGORY = "Universidad";
    private final TaskRepository taskRepository;
    private final CategoryService categoryService;
    private final SubjectService subjectService;
    private final ApplicationEventPublisher events;

    public TaskService(TaskRepository taskRepository, CategoryService categoryService, SubjectService subjectService, ApplicationEventPublisher events) {
        this.taskRepository = taskRepository;
        this.categoryService = categoryService;
        this.subjectService = subjectService;
        this.events = events;
    }

    public List<Task> listByUser(String userId) {
        return listByUser(userId, TaskFilter.empty());
    }

    public List<Task> listByUser(String userId, TaskFilter filter) {
        if (filter.dueFrom() != null && filter.dueTo() != null && filter.dueFrom().isAfter(filter.dueTo())) {
            throw new BusinessRuleException("El rango de fechas no es valido: dueFrom no puede ser posterior a dueTo");
        }
        // Filtrar por una categoría incluye también sus subcategorías.
        Set<String> categoryIds = filter.categoryId() == null || filter.categoryId().isBlank() ? null
                : categoryService.withSubcategories(userId, filter.categoryId().trim());
        return taskRepository.findByUserIdOrderByIdAsc(userId).stream()
                .filter(task -> filter.matches(task, categoryIds))
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

    /** Al borrar una materia, sus tareas se conservan pero dejan de estar vinculadas a ella. */
    @EventListener
    public void onSubjectDeleted(SubjectDeletedEvent event) {
        List<Task> affected = taskRepository.findByUserIdAndSubjectId(event.userId(), event.subjectId());
        affected.forEach(task -> task.setSubjectId(null));
        if (!affected.isEmpty()) taskRepository.saveAll(affected);
    }

    /** Publica un solo {@link TaskOverdueEvent} con cuántas tareas pendientes ya vencieron (hora local del usuario). */
    public int publishOverdue(String userId, LocalDateTime now) {
        int count = taskRepository.findByUserIdAndDoneFalseAndDueBefore(userId, now).size();
        if (count > 0) events.publishEvent(new TaskOverdueEvent(userId, count));
        return count;
    }

    /**
     * Publica un {@link TaskDueSoonEvent} por cada tarea pendiente del usuario con vencimiento en
     * [{@code from}, {@code to}] (hora local del usuario, como se guarda {@code due}). Lo invoca el recordatorio programado.
     * {@code imminent} marca el aviso de la última hora, que se deduplica aparte del de un día antes.
     *
     * @return cantidad de tareas notificadas
     */
    public int publishDueSoon(String userId, LocalDateTime from, LocalDateTime to, boolean imminent) {
        List<Task> dueSoon = taskRepository.findByUserIdAndDoneFalseAndDueBetween(userId, from, to);
        dueSoon.forEach(task -> events.publishEvent(new TaskDueSoonEvent(task.getUserId(), task.getId(), task.getTitle(), task.getDue(), imminent)));
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
        String clientId = request.id() == null || request.id().isBlank() ? null : request.id().trim().toLowerCase();
        if (clientId != null) {
            Optional<Task> existing = taskRepository.findById(clientId);
            if (existing.isPresent()) {
                // Reenvío del mismo cambio (p. ej. se perdió la respuesta): se devuelve lo ya creado, sin duplicar.
                if (!existing.get().getUserId().equals(userId)) throw new BusinessRuleException("El identificador de la tarea ya esta en uso");
                return existing.get();
            }
        }
        Task task = new Task();
        task.setId(clientId != null ? clientId : UUID.randomUUID().toString());
        task.setUserId(userId);
        task.setTitle(request.title().trim());
        task.setDue(DueDate.parse(request.due()));
        task.setPriority(request.priority() == null ? Priority.MEDIUM : request.priority());
        task.setCategoryId(resolveNewCategory(userId, request.categoryId()));
        task.setSubjectId(resolveSubject(userId, request.subjectId()));
        if (task.getSubjectId() != null && task.getCategoryId() == null) task.setCategoryId(universityCategoryId(userId));
        task.setDone(false);
        Task saved = persist(task, null);
        events.publishEvent(new TaskCreatedEvent(userId, saved.getId(), saved.getTitle(), saved.getDue()));
        return saved;
    }

    public Task updateStatus(String userId, String id, UpdateTaskStatusRequest request) {
        Task task = getOwned(userId, id);
        requireNotStale(task, request.getClientTime());
        task.markAll(request.isDone());
        return persist(task, request.getClientTime());
    }

    public Task addSubtask(String userId, String taskId, CreateSubtaskRequest request) {
        Task task = getOwned(userId, taskId);
        requireSubtaskTitle(request);
        task.getSubtasks().add(newSubtask(request));
        task.setDone(false);
        return persist(task, null);
    }

    public Task addNestedSubtask(String userId, String taskId, String parentSubtaskId, CreateSubtaskRequest request) {
        Task task = getOwned(userId, taskId);
        requireSubtaskTitle(request);
        Subtask parent = task.findSubtask(parentSubtaskId)
                .orElseThrow(() -> new BusinessRuleException("La subtarea padre no existe"));
        parent.getSubtasks().add(newSubtask(request));
        task.synchronizeCompletion();
        return persist(task, null);
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
        return persist(task, null);
    }

    public Task updateSubtaskStatus(String userId, String taskId, String subtaskId, UpdateSubtaskStatusRequest request) {
        Task task = getOwned(userId, taskId);
        Subtask subtask = requireSubtask(task, subtaskId);
        subtask.markTree(request.done());
        task.synchronizeCompletion();
        return persist(task, null);
    }

    public Task deleteSubtask(String userId, String taskId, String subtaskId) {
        Task task = getOwned(userId, taskId);
        if (!task.removeSubtask(subtaskId)) {
            throw new NotFoundException("Subtarea no encontrada");
        }
        task.synchronizeCompletion();
        return persist(task, null);
    }

    public Task update(String userId, String id, UpdateTaskRequest request) {
        Task task = getOwned(userId, id);
        requireNotStale(task, request.clientTime());

        task.setTitle(request.title() == null || request.title().isBlank() ? task.getTitle() : request.title().trim());
        // due: null = no cambiar; cadena vacia = quitar la fecha.
        if (request.due() != null) task.setDue(DueDate.parse(request.due()));
        if (request.priority() != null) task.setPriority(request.priority());
        // categoryId: null = no cambiar; cadena vacia = quitar la categoría.
        if (request.categoryId() != null) task.setCategoryId(resolveNewCategory(userId, request.categoryId()));
        // subjectId: null = no cambiar; cadena vacia = quitar la materia. Al vincular una materia a una tarea sin categoría, queda en Universidad.
        if (request.subjectId() != null) {
            task.setSubjectId(resolveSubject(userId, request.subjectId()));
            if (task.getSubjectId() != null && task.getCategoryId() == null) task.setCategoryId(universityCategoryId(userId));
        }
        return persist(task, request.clientTime());
    }

    /** Cuánto adelante del reloj del servidor se tolera la hora de un cliente antes de tomarla como «ahora». */
    private static final Duration CLOCK_SKEW = Duration.ofMinutes(5);

    /**
     * Un cambio hecho sin conexión no pisa a uno más reciente: si la tarea se modificó después del momento en que el
     * usuario hizo este cambio, se rechaza con 409 (gana la última escritura, medida por la hora del cambio).
     */
    private void requireNotStale(Task task, Instant clientTime) {
        if (clientTime != null && task.getUpdatedAt() != null && task.getUpdatedAt().isAfter(clientTime)) {
            throw new ConflictException("La tarea cambió en otro dispositivo después de este cambio, por eso no se aplicó");
        }
    }

    /**
     * Guarda sellando el momento lógico del cambio: la hora del cliente si vino (así los cambios que se hicieron sin
     * conexión y llegan en orden no se estorban entre sí), acotada a «ahora» si es del futuro.
     */
    private Task persist(Task task, Instant clientTime) {
        Instant now = Instant.now();
        Instant at = clientTime == null || clientTime.isAfter(now.plus(CLOCK_SKEW)) ? now : clientTime;
        task.setUpdatedAt(at);
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

    /** La materia indicada (debe ser del usuario: si no, 404), o null si viene vacía. */
    private String resolveSubject(String userId, String subjectId) {
        if (subjectId == null || subjectId.isBlank()) return null;
        return subjectService.getOwned(userId, subjectId.trim()).getId();
    }

    /** La categoría «Universidad» del usuario, si la tiene (no se crea una). */
    private String universityCategoryId(String userId) {
        return categoryService.findRootByName(userId, UNIVERSITY_CATEGORY).map(Category::getId).orElse(null);
    }

    private String resolveNewCategory(String userId, String categoryId) {
        if (categoryId == null || categoryId.isBlank()) return null;
        return categoryService.getOwned(userId, categoryId.trim()).getId();
    }
}
