package com.app.myorbit.tasks.api;

import com.app.myorbit.tasks.domain.Subtask;

import java.time.LocalDateTime;
import java.util.List;

public record SubtaskResponse(String id, String title, boolean done, LocalDateTime due, List<SubtaskResponse> subtasks) {
    public static SubtaskResponse from(Subtask subtask) {
        return new SubtaskResponse(subtask.getId(), subtask.getTitle(), subtask.isDone(), subtask.getDue(),
                subtask.getSubtasks().stream().map(SubtaskResponse::from).toList());
    }
}
