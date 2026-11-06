package com.app.myorbit.academic.application;

/**
 * @param currentGrade promedio ponderado de lo evaluado hasta ahora; null si no hay notas
 * @param accumulatedPoints puntos ya ganados sobre la nota final (nota × porcentaje / 100)
 * @param gradedPercentage porcentaje de la materia ya calificado
 * @param remainingPercentage porcentaje que falta por calificar (incluye lo aún no planeado)
 * @param targetGrade nota final que se quiere alcanzar
 * @param requiredGrade promedio necesario en lo que falta para alcanzar la meta; null si no queda nada por calificar
 * @param achievable false si la nota necesaria supera el máximo posible
 */
public record GradeSummary(Double currentGrade, double accumulatedPoints, double gradedPercentage,
                           double remainingPercentage, double targetGrade, Double requiredGrade, boolean achievable) {
}
