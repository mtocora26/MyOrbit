package com.app.myorbit.academic.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "subjects")
public class Subject {
    public static final int MIN_CREDITS = 1;
    public static final int MAX_CREDITS = 20;
    public static final double DEFAULT_PASSING_GRADE = 3.0;

    @Id
    private String id;
    private String userId;
    private String name;
    private int credits;
    private String semester;
    private String color;
    /** Meta de la materia (opcional): si falta, cae a la del semestre/Perfil y luego a 3,0. */
    private Double targetGrade;
    /** Nota mínima para aprobar (opcional): si falta se usa {@link #DEFAULT_PASSING_GRADE}. */
    private Double passingGrade;

    /** Aplica los datos editables protegiendo las invariantes: nombre sin espacios sobrantes y créditos en rango. */
    public void update(String name, int credits, String semester, String color) {
        update(name, credits, semester, color, null, null);
    }

    /** Igual que arriba, con la meta de la materia y la nota mínima para aprobar (null = usar las por defecto). */
    public void update(String name, int credits, String semester, String color, Double targetGrade, Double passingGrade) {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("El nombre de la materia es obligatorio");
        if (credits < MIN_CREDITS || credits > MAX_CREDITS) throw new IllegalArgumentException("Los creditos deben estar entre " + MIN_CREDITS + " y " + MAX_CREDITS);
        if (targetGrade != null && (targetGrade < 0 || targetGrade > 5)) throw new IllegalArgumentException("La meta debe estar entre 0 y 5");
        if (passingGrade != null && (passingGrade < 0 || passingGrade > 5)) throw new IllegalArgumentException("La nota para aprobar debe estar entre 0 y 5");
        if (targetGrade != null && passingGrade != null && targetGrade < passingGrade) throw new IllegalArgumentException("La meta no puede ser menor que la nota para aprobar");
        this.name = name.trim();
        this.credits = credits;
        this.semester = semester;
        this.color = color;
        this.targetGrade = targetGrade;
        this.passingGrade = passingGrade;
    }

    /** Nota mínima para aprobar que aplica a esta materia. */
    public double effectivePassingGrade() {
        return passingGrade != null ? passingGrade : DEFAULT_PASSING_GRADE;
    }

    /** Cambia solo el semestre (cuando se renombra el semestre al que pertenece). */
    public void moveToSemester(String semester) {
        this.semester = semester;
    }

    public boolean hasName(String other) {
        return name != null && other != null && name.equalsIgnoreCase(other.trim());
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getName() { return name; }
    public int getCredits() { return credits; }
    public String getSemester() { return semester; }
    public String getColor() { return color; }
    public Double getTargetGrade() { return targetGrade; }
    public Double getPassingGrade() { return passingGrade; }
}
