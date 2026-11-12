package com.app.myorbit.academic.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "subjects")
public class Subject {
    public static final int MIN_CREDITS = 1;
    public static final int MAX_CREDITS = 20;
    public static final double DEFAULT_PASSING_GRADE = 3.0;
    public static final int MAX_SLOTS = 14;

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
    /** Horario semanal de la materia (opcional): una o varias franjas que se repiten mientras dura el semestre. */
    private List<ClassSlot> schedule = new ArrayList<>();

    /** Aplica los datos editables protegiendo las invariantes: nombre sin espacios sobrantes y créditos en rango. */
    public void update(String name, int credits, String semester, String color) {
        update(name, credits, semester, color, null, null);
    }

    /** Igual que arriba, con la meta de la materia y la nota mínima para aprobar (null = usar las por defecto). */
    public void update(String name, int credits, String semester, String color, Double targetGrade, Double passingGrade) {
        update(name, credits, semester, color, targetGrade, passingGrade, List.of());
    }

    /**
     * Igual que arriba, con el horario. Las franjas de una materia no pueden solaparse entre sí; null o vacío = sin horario.
     */
    public void update(String name, int credits, String semester, String color, Double targetGrade, Double passingGrade, List<ClassSlot> schedule) {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("El nombre de la materia es obligatorio");
        if (credits < MIN_CREDITS || credits > MAX_CREDITS) throw new IllegalArgumentException("Los creditos deben estar entre " + MIN_CREDITS + " y " + MAX_CREDITS);
        if (targetGrade != null && (targetGrade < 0 || targetGrade > 5)) throw new IllegalArgumentException("La meta debe estar entre 0 y 5");
        if (passingGrade != null && (passingGrade < 0 || passingGrade > 5)) throw new IllegalArgumentException("La nota para aprobar debe estar entre 0 y 5");
        if (targetGrade != null && passingGrade != null && targetGrade < passingGrade) throw new IllegalArgumentException("La meta no puede ser menor que la nota para aprobar");
        List<ClassSlot> slots = schedule == null ? List.of() : schedule;
        if (slots.size() > MAX_SLOTS) throw new IllegalArgumentException("Una materia admite como maximo " + MAX_SLOTS + " franjas de horario");
        for (int i = 0; i < slots.size(); i++) {
            for (int j = i + 1; j < slots.size(); j++) {
                if (slots.get(i).overlaps(slots.get(j))) {
                    throw new IllegalArgumentException("Las franjas se solapan: " + slots.get(i).describe() + " y " + slots.get(j).describe());
                }
            }
        }
        this.name = name.trim();
        this.credits = credits;
        this.semester = semester;
        this.color = color;
        this.targetGrade = targetGrade;
        this.passingGrade = passingGrade;
        this.schedule = new ArrayList<>(slots);
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
    public List<ClassSlot> getSchedule() { return List.copyOf(schedule); }
}
