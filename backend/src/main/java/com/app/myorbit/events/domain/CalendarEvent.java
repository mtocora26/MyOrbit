package com.app.myorbit.events.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.time.temporal.ChronoUnit;

/**
 * Actividad de un día o de varios («semana de parciales»): título, rango de fechas y hora opcional. No se repite como una
 * clase ni es una fecha límite como una tarea. Puede asociarse a una materia o a una categoría.
 *
 * <p>Las horas se guardan como texto {@code HH:mm} (horas "de pared" sin zona), igual que las franjas del horario.
 */
@Document(collection = "calendar_events")
public class CalendarEvent {
    public static final int MAX_TITLE_LENGTH = 200;
    /** Duración máxima en días (ambos extremos incluidos). */
    public static final int MAX_DAYS = 366;
    private static final DateTimeFormatter HOUR_MINUTE = DateTimeFormatter.ofPattern("HH:mm").withResolverStyle(ResolverStyle.STRICT);

    @Id
    private String id;
    private String userId;
    private String title;
    private LocalDate startDate;
    /** Último día del evento (incluido); igual a {@code startDate} si dura un solo día. */
    private LocalDate endDate;
    /** Hora de inicio (HH:mm), opcional: la del primer día. */
    private String startTime;
    /** Hora de fin (HH:mm), opcional y solo con hora de inicio: la del último día. */
    private String endTime;
    private String subjectId;
    private String categoryId;

    /**
     * Aplica los datos editables protegiendo las invariantes: título obligatorio, {@code endDate} no anterior al inicio
     * (null = un solo día), duración acotada, y horas {@code HH:mm} donde la de fin exige la de inicio y, en un evento de
     * un solo día, es posterior a ella.
     */
    public void update(String title, LocalDate startDate, LocalDate endDate, String startTime, String endTime) {
        if (title == null || title.isBlank()) throw new IllegalArgumentException("El titulo del evento es obligatorio");
        if (title.trim().length() > MAX_TITLE_LENGTH) throw new IllegalArgumentException("El titulo es demasiado largo");
        if (startDate == null) throw new IllegalArgumentException("La fecha de inicio es obligatoria");
        LocalDate lastDay = endDate == null ? startDate : endDate;
        if (lastDay.isBefore(startDate)) throw new IllegalArgumentException("La fecha de fin no puede ser anterior a la de inicio");
        if (ChronoUnit.DAYS.between(startDate, lastDay) + 1 > MAX_DAYS) throw new IllegalArgumentException("Un evento no puede durar mas de " + MAX_DAYS + " dias");
        LocalTime start = parseTime(startTime, "inicio");
        LocalTime end = parseTime(endTime, "fin");
        if (end != null && start == null) throw new IllegalArgumentException("La hora de fin requiere una hora de inicio");
        if (start != null && end != null && lastDay.equals(startDate) && !end.isAfter(start)) {
            throw new IllegalArgumentException("La hora de fin debe ser posterior a la de inicio");
        }
        this.title = title.trim();
        this.startDate = startDate;
        this.endDate = lastDay;
        this.startTime = start == null ? null : start.format(HOUR_MINUTE);
        this.endTime = end == null ? null : end.format(HOUR_MINUTE);
    }

    private static LocalTime parseTime(String value, String label) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalTime.parse(value.trim(), HOUR_MINUTE);
        } catch (DateTimeParseException invalid) {
            throw new IllegalArgumentException("La hora de " + label + " debe tener el formato HH:mm");
        }
    }

    public boolean isMultiDay() { return endDate.isAfter(startDate); }

    /** El evento ocupa al menos un día dentro de [from, to] (extremos opcionales, incluidos). */
    public boolean overlaps(LocalDate from, LocalDate to) {
        return (from == null || !endDate.isBefore(from)) && (to == null || !startDate.isAfter(to));
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getTitle() { return title; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public String getStartTime() { return startTime; }
    public String getEndTime() { return endTime; }
    public String getSubjectId() { return subjectId; }
    public void setSubjectId(String subjectId) { this.subjectId = subjectId; }
    public String getCategoryId() { return categoryId; }
    public void setCategoryId(String categoryId) { this.categoryId = categoryId; }
}
