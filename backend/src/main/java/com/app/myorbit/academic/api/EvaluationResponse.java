package com.app.myorbit.academic.api;

import com.app.myorbit.academic.domain.Evaluation;

public record EvaluationResponse(String id, String subjectId, String name, double percentage, Double grade) {
    public static EvaluationResponse from(Evaluation evaluation) {
        return new EvaluationResponse(evaluation.getId(), evaluation.getSubjectId(), evaluation.getName(),
                evaluation.getPercentage(), evaluation.getGrade());
    }
}
