package com.app.myorbit.academic.api;

import com.app.myorbit.academic.application.ClassAgendaService.ClassOccurrence;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** Una clase concreta. {@code start}/{@code end} son horas {@code HH:mm} y {@code startsAt}/{@code endsAt} la fecha y hora completas (sin zona). */
public record ClassOccurrenceResponse(String subjectId, String subjectName, String subjectColor, LocalDate date,
                                      String start, String end, String room, LocalDateTime startsAt, LocalDateTime endsAt) {
    public static ClassOccurrenceResponse from(ClassOccurrence occurrence) {
        return new ClassOccurrenceResponse(occurrence.subject().getId(), occurrence.subject().getName(), occurrence.subject().getColor(),
                occurrence.date(), occurrence.slot().getStart(), occurrence.slot().getEnd(), occurrence.slot().getRoom(),
                occurrence.startsAt(), occurrence.endsAt());
    }
}
