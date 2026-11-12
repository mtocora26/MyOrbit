package com.app.myorbit.academic.application;

/**
 * @param currentGrade promedio ponderado de lo evaluado hasta ahora; null si no hay notas
 * @param accumulatedPoints puntos ya ganados sobre la nota final (nota × porcentaje / 100)
 * @param gradedPercentage porcentaje de la materia ya calificado
 * @param remainingPercentage porcentaje que falta por calificar (incluye lo aún no planeado)
 * @param targetGrade nota final que se quiere alcanzar (la meta)
 * @param requiredGrade promedio necesario en lo que falta para alcanzar la meta; null si no queda nada por calificar
 * @param achievable false si la nota necesaria supera el máximo posible
 * @param passingGrade nota mínima para aprobar
 * @param requiredToPass promedio necesario en lo que falta para aprobar; null si no queda nada por calificar
 * @param canPass false si ya no alcanza para aprobar (lo necesario supera el máximo, o la materia está completa por debajo)
 */
public record GradeSummary(Double currentGrade, double accumulatedPoints, double gradedPercentage,
                           double remainingPercentage, double targetGrade, Double requiredGrade, boolean achievable,
                           double passingGrade, Double requiredToPass, boolean canPass) {

    /** Sin nota para aprobar propia: aprobar coincide con la meta. */
    public GradeSummary(Double currentGrade, double accumulatedPoints, double gradedPercentage, double remainingPercentage,
                        double targetGrade, Double requiredGrade, boolean achievable) {
        this(currentGrade, accumulatedPoints, gradedPercentage, remainingPercentage, targetGrade, requiredGrade, achievable,
                targetGrade, requiredGrade, achievable);
    }
}
