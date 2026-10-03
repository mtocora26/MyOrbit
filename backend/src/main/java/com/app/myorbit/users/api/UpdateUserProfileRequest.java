package com.app.myorbit.users.api;

public record UpdateUserProfileRequest(String program, String semester, String studentCode, String gradeTarget) {
}