package com.app.myorbit.academic.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "subjects")
public class Subject {
    public static final int MIN_CREDITS = 1;
    public static final int MAX_CREDITS = 20;

    @Id
    private String id;
    private String userId;
    private String name;
    private int credits;
    private String semester;
    private String color;

    /** Aplica los datos editables protegiendo las invariantes: nombre sin espacios sobrantes y créditos en rango. */
    public void update(String name, int credits, String semester, String color) {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("El nombre de la materia es obligatorio");
        if (credits < MIN_CREDITS || credits > MAX_CREDITS) throw new IllegalArgumentException("Los creditos deben estar entre " + MIN_CREDITS + " y " + MAX_CREDITS);
        this.name = name.trim();
        this.credits = credits;
        this.semester = semester;
        this.color = color;
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
}
