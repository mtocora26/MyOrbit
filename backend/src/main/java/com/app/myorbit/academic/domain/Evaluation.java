package com.app.myorbit.academic.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "evaluations")
public class Evaluation {
    public static final double MAX_PERCENTAGE = 100;
    public static final double MIN_GRADE = 0;
    public static final double MAX_GRADE = 5;

    @Id
    private String id;
    private String userId;
    private String subjectId;
    private String name;
    private double percentage;
    private Double grade;

    /** Aplica los datos editables protegiendo las invariantes. La nota es opcional hasta que se conoce. */
    public void update(String name, double percentage, Double grade) {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("El nombre de la evaluacion es obligatorio");
        if (percentage <= 0 || percentage > MAX_PERCENTAGE) throw new IllegalArgumentException("El porcentaje debe ser mayor que 0 y maximo " + (int) MAX_PERCENTAGE);
        if (grade != null && (grade < MIN_GRADE || grade > MAX_GRADE)) throw new IllegalArgumentException("La nota debe estar entre " + (int) MIN_GRADE + " y " + (int) MAX_GRADE);
        this.name = name.trim();
        this.percentage = percentage;
        this.grade = grade;
    }

    public boolean isGraded() { return grade != null; }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getSubjectId() { return subjectId; }
    public void setSubjectId(String subjectId) { this.subjectId = subjectId; }
    public String getName() { return name; }
    public double getPercentage() { return percentage; }
    public Double getGrade() { return grade; }
}
