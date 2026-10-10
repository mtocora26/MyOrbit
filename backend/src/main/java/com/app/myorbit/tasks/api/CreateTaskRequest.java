package com.app.myorbit.tasks.api;

import com.app.myorbit.tasks.domain.Priority;

public record CreateTaskRequest(String title, String due, Priority priority, String tag) {
}
