package com.app.myorbit.academic.api;

import com.app.myorbit.academic.domain.Subject;

/** {@code targetGrade} y {@code passingGrade} son los guardados en la materia (null = se usan los por defecto). */
public record SubjectResponse(String id, String name, int credits, String semester, String color, Double targetGrade, Double passingGrade) {
    public static SubjectResponse from(Subject subject) {
        return new SubjectResponse(subject.getId(), subject.getName(), subject.getCredits(), subject.getSemester(), subject.getColor(),
                subject.getTargetGrade(), subject.getPassingGrade());
    }
}
