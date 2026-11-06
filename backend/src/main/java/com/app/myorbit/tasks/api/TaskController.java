package com.app.myorbit.tasks.api;

import jakarta.validation.Valid;
import com.app.myorbit.tasks.application.TaskFilter;
import com.app.myorbit.tasks.application.TaskService;
import com.app.myorbit.tasks.domain.Priority;
import com.app.myorbit.users.api.CurrentUser;
import com.app.myorbit.users.domain.User;
import org.springframework.http.HttpStatus;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public List<TaskResponse> list(@CurrentUser User user,
                                   @RequestParam(required = false) Boolean done,
                                   @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dueFrom,
                                   @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dueTo,
                                   @RequestParam(required = false) String priority,
                                   @RequestParam(required = false) String categoryId,
                                   @RequestParam(required = false, defaultValue = "false") boolean uncategorized) {
        Priority parsedPriority = priority == null ? null : Priority.parse(priority);
        return taskService.listByUser(user.getId(), new TaskFilter(done, dueFrom, dueTo, parsedPriority, categoryId, uncategorized)).stream().map(TaskResponse::from).toList();
    }

    @GetMapping("/{id}")
    public TaskResponse getById(@PathVariable String id, @CurrentUser User user) {
        return TaskResponse.from(taskService.getOwned(user.getId(), id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse create(@Valid @RequestBody CreateTaskRequest request, @CurrentUser User user) {
        return TaskResponse.from(taskService.create(user.getId(), request));
    }

    @PatchMapping("/{id}/status")
    public TaskResponse updateStatus(@PathVariable String id, @Valid @RequestBody UpdateTaskStatusRequest request, @CurrentUser User user) {
        return TaskResponse.from(taskService.updateStatus(user.getId(), id, request));
    }

    @PutMapping("/{id}")
    public TaskResponse update(@PathVariable String id, @Valid @RequestBody UpdateTaskRequest request, @CurrentUser User user) {
        return TaskResponse.from(taskService.update(user.getId(), id, request));
    }

    @PostMapping("/{id}/subtasks")
    public TaskResponse addSubtask(@PathVariable String id, @Valid @RequestBody CreateSubtaskRequest request, @CurrentUser User user) {
        return TaskResponse.from(taskService.addSubtask(user.getId(), id, request));
    }

    @PostMapping("/{id}/subtasks/{parentSubtaskId}")
    public TaskResponse addNestedSubtask(@PathVariable String id, @PathVariable String parentSubtaskId, @Valid @RequestBody CreateSubtaskRequest request, @CurrentUser User user) {
        return TaskResponse.from(taskService.addNestedSubtask(user.getId(), id, parentSubtaskId, request));
    }

    @PutMapping("/{id}/subtasks/{subtaskId}")
    public TaskResponse updateSubtask(@PathVariable String id, @PathVariable String subtaskId, @Valid @RequestBody UpdateSubtaskRequest request, @CurrentUser User user) {
        return TaskResponse.from(taskService.updateSubtask(user.getId(), id, subtaskId, request));
    }

    @PatchMapping("/{id}/subtasks/{subtaskId}/status")
    public TaskResponse updateSubtaskStatus(@PathVariable String id, @PathVariable String subtaskId, @Valid @RequestBody UpdateSubtaskStatusRequest request, @CurrentUser User user) {
        return TaskResponse.from(taskService.updateSubtaskStatus(user.getId(), id, subtaskId, request));
    }

    @DeleteMapping("/{id}/subtasks/{subtaskId}")
    public TaskResponse deleteSubtask(@PathVariable String id, @PathVariable String subtaskId, @CurrentUser User user) {
        return TaskResponse.from(taskService.deleteSubtask(user.getId(), id, subtaskId));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id, @CurrentUser User user) {
        taskService.delete(user.getId(), id);
    }
}
