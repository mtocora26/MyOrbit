package com.app.myorbit.academic.api;

import com.app.myorbit.academic.domain.Semester;

import java.time.LocalDate;

/**
 * {@code current}: hoy (en la zona del usuario) cae dentro de sus fechas. {@code missingDates}: falta inicio o fin.
 * {@code targetAverage}: meta de promedio del semestre (null = sin meta propia).
 */
public record SemesterResponse(String id, String name, LocalDate startDate, LocalDate endDate, boolean current, boolean missingDates, Double targetAverage) {
    public static SemesterResponse from(Semester semester, LocalDate today) {
        return new SemesterResponse(semester.getId(), semester.getName(), semester.getStartDate(), semester.getEndDate(),
                semester.contains(today), !semester.hasDates(), semester.getTargetAverage());
    }
}
