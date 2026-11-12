package com.app.myorbit.academic.domain;

/**
 * Parte de un corte (p. ej. «Parcial» 70 % y «Actividades» 30 %). El porcentaje es sobre el corte, no sobre la materia.
 * La nota es opcional hasta que se conoce.
 */
public class EvaluationComponent {
    private String name;
    private double percentage;
    private Double grade;

    public EvaluationComponent() {
    }

    /** Crea un componente protegiendo las invariantes: nombre, porcentaje en (0, 100] y nota entre 0 y 5. */
    public static EvaluationComponent of(String name, double percentage, Double grade) {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("El nombre del componente es obligatorio");
        if (percentage <= 0 || percentage > Evaluation.MAX_PERCENTAGE) throw new IllegalArgumentException("El porcentaje del componente debe ser mayor que 0 y maximo " + (int) Evaluation.MAX_PERCENTAGE);
        if (grade != null && (grade < Evaluation.MIN_GRADE || grade > Evaluation.MAX_GRADE)) throw new IllegalArgumentException("La nota del componente debe estar entre " + (int) Evaluation.MIN_GRADE + " y " + (int) Evaluation.MAX_GRADE);
        EvaluationComponent component = new EvaluationComponent();
        component.name = name.trim();
        component.percentage = percentage;
        component.grade = grade;
        return component;
    }

    public boolean isGraded() { return grade != null; }

    public String getName() { return name; }
    public double getPercentage() { return percentage; }
    public Double getGrade() { return grade; }
}
