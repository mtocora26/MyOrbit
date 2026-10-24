package com.app.myorbit.academic.api;

import com.app.myorbit.academic.domain.Subject;

public record SubjectResponse(String id, String name, int credits, String semester, String color) {
    public static SubjectResponse from(Subject subject) {
        return new SubjectResponse(subject.getId(), subject.getName(), subject.getCredits(), subject.getSemester(), subject.getColor());
    }
}
