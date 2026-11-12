package com.app.myorbit.academic.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

/** Periodo académico de un usuario. Las materias lo referencian por nombre (AAAA-1 / AAAA-2). */
@Document(collection = "semesters")
public class Semester {
    public static final String NAME_PATTERN = "^\\d{4}-[12]$";

    @Id
    private String id;
    private String userId;
    private String name;
    /** Fechas opcionales: pueden faltar hasta que el usuario las complete. */
    private LocalDate startDate;
    private LocalDate endDate;
    /** Meta de promedio del semestre (opcional). */
    private Double targetAverage;

    /** Aplica los datos editables protegiendo las invariantes: nombre válido y fin no anterior al inicio. */
    public void update(String name, LocalDate startDate, LocalDate endDate) {
        update(name, startDate, endDate, null);
    }

    /** Igual que arriba, con la meta de promedio del semestre (null = sin meta propia). */
    public void update(String name, LocalDate startDate, LocalDate endDate, Double targetAverage) {
        if (targetAverage != null && (targetAverage < 0 || targetAverage > 5)) throw new IllegalArgumentException("La meta del semestre debe estar entre 0 y 5");
        if (name == null || !name.trim().matches(NAME_PATTERN)) throw new IllegalArgumentException("El semestre debe tener el formato AAAA-1 o AAAA-2");
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) throw new IllegalArgumentException("La fecha de fin no puede ser anterior a la de inicio");
        this.name = name.trim();
        this.startDate = startDate;
        this.endDate = endDate;
        this.targetAverage = targetAverage;
    }

    public boolean hasDates() { return startDate != null && endDate != null; }

    /** Es el semestre en curso si hoy cae entre el inicio y el fin (ambos incluidos). */
    public boolean contains(LocalDate day) {
        return hasDates() && !day.isBefore(startDate) && !day.isAfter(endDate);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getName() { return name; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public Double getTargetAverage() { return targetAverage; }
}
