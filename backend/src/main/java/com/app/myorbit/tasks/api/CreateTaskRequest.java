package com.app.myorbit.tasks.api;

public record CreateTaskRequest(String title, String due, String priority, String tag) {
}
