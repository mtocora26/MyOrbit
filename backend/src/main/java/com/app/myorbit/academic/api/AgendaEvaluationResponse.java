package com.app.myorbit.academic.api;

import com.app.myorbit.academic.application.EvaluationAgendaService.AgendaItem;

import java.time.LocalDateTime;

public record AgendaEvaluationResponse(String id, String subjectId, String subjectName, String subjectColor,
                                       String name, double percentage, Double grade, LocalDateTime due) {
    public static AgendaEvaluationResponse from(AgendaItem item) {
        return new AgendaEvaluationResponse(item.evaluation().getId(), item.subject().getId(), item.subject().getName(),
                item.subject().getColor(), item.evaluation().getName(), item.evaluation().getPercentage(),
                item.evaluation().effectiveGrade(), item.evaluation().getDue());
    }
}
