package com.app.myorbit.tasks.api;

public record UpdateTaskRequest(String title, String due, String priority, String tag) {
}
