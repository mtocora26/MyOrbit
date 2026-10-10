package com.app.myorbit.tasks.api;

import com.app.myorbit.tasks.domain.Task;

import java.util.List;

public record TaskResponse(String id, String userId, String title, String due, String priority, String tag,
                           boolean done, List<SubtaskResponse> subtasks) {
    public static TaskResponse from(Task task) {
        return new TaskResponse(task.getId(), task.getUserId(), task.getTitle(), task.getDue(), task.getPriority(),
                task.getTag(), task.isDone(), task.getSubtasks().stream().map(SubtaskResponse::from).toList());
    }
}
