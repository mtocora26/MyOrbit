package com.app.myorbit.academic.domain;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.time.format.TextStyle;
import java.util.Locale;

/**
 * Franja semanal de una materia: un día de la semana, hora de inicio y de fin, y un salón opcional. Se repite cada
 * semana mientras dura el semestre.
 *
 * <p>Las horas se guardan como texto {@code HH:mm}: son horas "de pared" sin zona, y Mongo guardaría un
 * {@link LocalTime} como fecha dependiente de la zona del servidor.
 */
public class ClassSlot {
    public static final int MAX_ROOM_LENGTH = 50;
    private static final DateTimeFormatter HOUR_MINUTE = DateTimeFormatter.ofPattern("HH:mm").withResolverStyle(ResolverStyle.STRICT);
    private static final Locale SPANISH = Locale.forLanguageTag("es");

    /** 1 = lunes ... 7 = domingo (ISO). */
    private int dayOfWeek;
    private String start;
    private String end;
    private String room;

    public ClassSlot() {
    }

    /** Crea la franja protegiendo las invariantes: día 1–7, horas HH:mm con fin posterior al inicio y salón acotado. */
    public static ClassSlot of(int dayOfWeek, String start, String end, String room) {
        if (dayOfWeek < 1 || dayOfWeek > 7) throw new IllegalArgumentException("El dia de la clase debe estar entre 1 (lunes) y 7 (domingo)");
        LocalTime startTime = parse(start, "inicio");
        LocalTime endTime = parse(end, "fin");
        if (!endTime.isAfter(startTime)) throw new IllegalArgumentException("La hora de fin debe ser posterior a la de inicio");
        String cleanRoom = room == null || room.isBlank() ? null : room.trim();
        if (cleanRoom != null && cleanRoom.length() > MAX_ROOM_LENGTH) throw new IllegalArgumentException("El salon es demasiado largo");
        ClassSlot slot = new ClassSlot();
        slot.dayOfWeek = dayOfWeek;
        slot.start = startTime.format(HOUR_MINUTE);
        slot.end = endTime.format(HOUR_MINUTE);
        slot.room = cleanRoom;
        return slot;
    }

    private static LocalTime parse(String value, String label) {
        try {
            return LocalTime.parse(value == null ? "" : value.trim(), HOUR_MINUTE);
        } catch (DateTimeParseException invalid) {
            throw new IllegalArgumentException("La hora de " + label + " debe tener el formato HH:mm");
        }
    }

    /** Dos franjas se solapan si son el mismo día y sus horas se cruzan; que una termine justo cuando empieza la otra no cuenta. */
    public boolean overlaps(ClassSlot other) {
        return dayOfWeek == other.dayOfWeek && startTime().isBefore(other.endTime()) && other.startTime().isBefore(endTime());
    }

    public LocalTime startTime() { return LocalTime.parse(start, HOUR_MINUTE); }
    public LocalTime endTime() { return LocalTime.parse(end, HOUR_MINUTE); }
    public DayOfWeek day() { return DayOfWeek.of(dayOfWeek); }

    /** «lunes 08:00-10:00», para mensajes de error. */
    public String describe() {
        return day().getDisplayName(TextStyle.FULL, SPANISH) + " " + start + "-" + end;
    }

    public int getDayOfWeek() { return dayOfWeek; }
    public String getStart() { return start; }
    public String getEnd() { return end; }
    public String getRoom() { return room; }
}
