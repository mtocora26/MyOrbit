package com.app.myorbit.habits.api;

public record UpdateHabitCompletionRequest(boolean completed, String date) {
}