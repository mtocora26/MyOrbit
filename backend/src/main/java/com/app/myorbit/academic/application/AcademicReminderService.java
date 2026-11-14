package com.app.myorbit.academic.application;

import com.app.myorbit.academic.domain.ExamSoonEvent;
import com.app.myorbit.academic.domain.Semester;
import com.app.myorbit.academic.domain.SubjectAtRiskEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

/** Detecta lo académico que merece un aviso (parciales próximos, materias en riesgo) y lo publica como evento. */
@Service
public class AcademicReminderService {
    private final EvaluationAgendaService agendaService;
    private final AcademicSummaryService summaryService;
    private final SemesterService semesterService;
    private final ApplicationEventPublisher events;

    public AcademicReminderService(EvaluationAgendaService agendaService, AcademicSummaryService summaryService,
                                   SemesterService semesterService, ApplicationEventPublisher events) {
        this.agendaService = agendaService;
        this.summaryService = summaryService;
        this.semesterService = semesterService;
        this.events = events;
    }

    /** Un {@link ExamSoonEvent} por cada evaluación sin calificar con fecha en [from, to]. */
    public int publishExamsSoon(String userId, LocalDateTime from, LocalDateTime to) {
        var upcoming = agendaService.listWithDue(userId, from, to).stream()
                .filter(item -> !item.evaluation().isGraded())
                .toList();
        upcoming.forEach(item -> events.publishEvent(new ExamSoonEvent(userId, item.evaluation().getId(),
                item.evaluation().getName(), item.subject().getName(), item.evaluation().getDue())));
        return upcoming.size();
    }

    /** Un {@link SubjectAtRiskEvent} por cada materia en riesgo de los semestres en curso (hoy dentro de sus fechas). */
    public int publishSubjectsAtRisk(String userId, LocalDate today) {
        Set<String> current = semesterService.listByUser(userId).stream()
                .filter(semester -> semester.hasDates() && semester.contains(today))
                .map(Semester::getName)
                .collect(Collectors.toSet());
        if (current.isEmpty()) return 0;
        var atRisk = summaryService.summarize(userId, null, null).atRisk().stream()
                .filter(subject -> current.contains(subject.semester()))
                .toList();
        atRisk.forEach(subject -> events.publishEvent(new SubjectAtRiskEvent(userId, subject.subjectId(), subject.name())));
        return atRisk.size();
    }
}
