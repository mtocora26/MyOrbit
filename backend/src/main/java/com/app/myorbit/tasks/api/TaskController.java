package com.app.myorbit.tasks.api;

import com.app.myorbit.tasks.application.TaskService;
import com.app.myorbit.tasks.domain.Task;
import com.app.myorbit.users.api.CurrentUser;
import com.app.myorbit.users.domain.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public List<Task> list(@CurrentUser User user) {
        return taskService.listByUser(user.getId());
    }

    @GetMapping("/{id}")
    public Task getById(@PathVariable String id, @CurrentUser User user) {
        return taskService.getOwned(user.getId(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Task create(@RequestBody CreateTaskRequest request, @CurrentUser User user) {
        request.setUserId(user.getId());
        return taskService.create(request);
    }

    @PatchMapping("/{id}/status")
    public Task updateStatus(@PathVariable String id, @RequestBody UpdateTaskStatusRequest request, @CurrentUser User user) {
        return taskService.updateStatus(user.getId(), id, request);
    }

    @PutMapping("/{id}")
    public Task update(@PathVariable String id, @RequestBody UpdateTaskRequest request, @CurrentUser User user) {
        return taskService.update(user.getId(), id, request);
    }

    @PostMapping("/{id}/subtasks")
    public ResponseEntity<Task> addSubtask(@PathVariable String id, @RequestBody CreateSubtaskRequest request, @CurrentUser User user) {
        Task task = taskService.addSubtask(user.getId(), id, request);
        return task == null ? ResponseEntity.badRequest().build() : ResponseEntity.ok(task);
    }

    @PostMapping("/{id}/subtasks/{parentSubtaskId}")
    public ResponseEntity<Task> addNestedSubtask(@PathVariable String id, @PathVariable String parentSubtaskId, @RequestBody CreateSubtaskRequest request, @CurrentUser User user) {
        Task task = taskService.addNestedSubtask(user.getId(), id, parentSubtaskId, request);
        return task == null ? ResponseEntity.badRequest().build() : ResponseEntity.ok(task);
    }

    @PutMapping("/{id}/subtasks/{subtaskId}")
    public ResponseEntity<Task> updateSubtask(@PathVariable String id, @PathVariable String subtaskId, @RequestBody UpdateSubtaskRequest request, @CurrentUser User user) {
        Task task = taskService.updateSubtask(user.getId(), id, subtaskId, request);
        return task == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(task);
    }

    @PatchMapping("/{id}/subtasks/{subtaskId}/status")
    public ResponseEntity<Task> updateSubtaskStatus(@PathVariable String id, @PathVariable String subtaskId, @RequestBody UpdateSubtaskStatusRequest request, @CurrentUser User user) {
        Task task = taskService.updateSubtaskStatus(user.getId(), id, subtaskId, request);
        return task == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(task);
    }

    @DeleteMapping("/{id}/subtasks/{subtaskId}")
    public ResponseEntity<Task> deleteSubtask(@PathVariable String id, @PathVariable String subtaskId, @CurrentUser User user) {
        Task task = taskService.deleteSubtask(user.getId(), id, subtaskId);
        return task == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(task);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id, @CurrentUser User user) {
        taskService.delete(user.getId(), id);
    }
}
