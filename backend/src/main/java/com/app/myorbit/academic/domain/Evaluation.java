package com.app.myorbit.academic.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "evaluations")
public class Evaluation {
    public static final double MAX_PERCENTAGE = 100;
    public static final double MIN_GRADE = 0;
    public static final double MAX_GRADE = 5;
    private static final double EPSILON = 1e-9;

    @Id
    private String id;
    private String userId;
    private String subjectId;
    private String name;
    private double percentage;
    private Double grade;
    /** Fecha (y hora) de la evaluación; opcional. */
    private LocalDateTime due;

    /**
     * Componentes opcionales del corte. Vacío = el corte tiene nota directa ({@link #grade}); con componentes, su nota
     * es el promedio ponderado de ellos y el campo {@code grade} no se usa.
     */
    private List<EvaluationComponent> components = new ArrayList<>();

    /** Aplica los datos editables protegiendo las invariantes. La nota es opcional hasta que se conoce. */
    public void update(String name, double percentage, Double grade) {
        update(name, percentage, grade, null);
    }

    /** Igual que arriba, con la fecha de la evaluación (null = sin fecha). */
    public void update(String name, double percentage, Double grade, LocalDateTime due) {
        update(name, percentage, grade, due, List.of());
    }

    /**
     * Igual que arriba, con componentes. Un corte con componentes no lleva nota directa y el peso de sus componentes
     * (sobre el corte) no puede superar 100.
     */
    public void update(String name, double percentage, Double grade, LocalDateTime due, List<EvaluationComponent> components) {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("El nombre de la evaluacion es obligatorio");
        if (percentage <= 0 || percentage > MAX_PERCENTAGE) throw new IllegalArgumentException("El porcentaje debe ser mayor que 0 y maximo " + (int) MAX_PERCENTAGE);
        if (grade != null && (grade < MIN_GRADE || grade > MAX_GRADE)) throw new IllegalArgumentException("La nota debe estar entre " + (int) MIN_GRADE + " y " + (int) MAX_GRADE);
        List<EvaluationComponent> parts = components == null ? List.of() : components;
        if (!parts.isEmpty() && grade != null) throw new IllegalArgumentException("Un corte con componentes no lleva nota directa: la nota sale de sus componentes");
        if (parts.stream().mapToDouble(EvaluationComponent::getPercentage).sum() > MAX_PERCENTAGE + EPSILON) throw new IllegalArgumentException("Los porcentajes de los componentes no pueden superar 100% del corte");
        this.name = name.trim();
        this.percentage = percentage;
        this.grade = grade;
        this.due = due;
        this.components = new ArrayList<>(parts);
    }

    public boolean hasComponents() { return !components.isEmpty(); }

    /** Todos los componentes tienen nota y juntos suman el 100 % del corte. */
    public boolean isComplete() {
        return hasComponents() && components.stream().allMatch(EvaluationComponent::isGraded)
                && Math.abs(componentsPercentage() - MAX_PERCENTAGE) <= EPSILON;
    }

    /** Con componentes solo cuenta como calificado cuando está completo; sin ellos, cuando tiene nota. */
    public boolean isGraded() { return hasComponents() ? isComplete() : grade != null; }

    /** Nota definitiva del corte: la directa, o el promedio ponderado de los componentes si está completo; si no, null. */
    public Double effectiveGrade() {
        if (!hasComponents()) return grade;
        return isComplete() ? componentsAverage() : null;
    }

    /** Nota provisional: igual que la definitiva, o el promedio de los componentes ya calificados aunque falten otros. */
    public Double provisionalGrade() {
        return hasComponents() ? componentsAverage() : grade;
    }

    private double componentsPercentage() {
        return components.stream().mapToDouble(EvaluationComponent::getPercentage).sum();
    }

    /** Promedio ponderado de los componentes calificados, normalizado por su peso; null si ninguno tiene nota. */
    private Double componentsAverage() {
        double weight = 0;
        double points = 0;
        for (EvaluationComponent component : components) {
            if (!component.isGraded()) continue;
            weight += component.getPercentage();
            points += component.getGrade() * component.getPercentage();
        }
        return weight > EPSILON ? points / weight : null;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getSubjectId() { return subjectId; }
    public void setSubjectId(String subjectId) { this.subjectId = subjectId; }
    public String getName() { return name; }
    public double getPercentage() { return percentage; }
    public Double getGrade() { return grade; }
    public LocalDateTime getDue() { return due; }
    public List<EvaluationComponent> getComponents() { return List.copyOf(components); }
}
