package com.app.myorbit.academic.api;

import com.app.myorbit.academic.domain.Evaluation;
import com.app.myorbit.academic.domain.EvaluationComponent;

import java.time.LocalDateTime;
import java.util.List;

/**
 * {@code grade} es la nota definitiva del corte (directa, o promedio de sus componentes cuando está completo; null si
 * falta). {@code provisionalGrade} es el promedio de los componentes ya calificados aunque falten otros.
 */
public record EvaluationResponse(String id, String subjectId, String name, double percentage, Double grade,
                                 LocalDateTime due, Double provisionalGrade, boolean complete, List<ComponentResponse> components) {

    public record ComponentResponse(String name, double percentage, Double grade) {
        static ComponentResponse from(EvaluationComponent component) {
            return new ComponentResponse(component.getName(), component.getPercentage(), component.getGrade());
        }
    }

    public static EvaluationResponse from(Evaluation evaluation) {
        return new EvaluationResponse(evaluation.getId(), evaluation.getSubjectId(), evaluation.getName(),
                evaluation.getPercentage(), round(evaluation.effectiveGrade()), evaluation.getDue(),
                round(evaluation.provisionalGrade()), evaluation.isGraded(),
                evaluation.getComponents().stream().map(ComponentResponse::from).toList());
    }

    private static Double round(Double value) {
        return value == null ? null : Math.round(value * 100) / 100.0;
    }
}
