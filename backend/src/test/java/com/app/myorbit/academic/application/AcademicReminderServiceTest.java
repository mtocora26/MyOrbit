package com.app.myorbit.academic.application;

import com.app.myorbit.academic.application.AcademicSummary.SubjectStanding;
import com.app.myorbit.academic.application.EvaluationAgendaService.AgendaItem;
import com.app.myorbit.academic.domain.Evaluation;
import com.app.myorbit.academic.domain.ExamSoonEvent;
import com.app.myorbit.academic.domain.Semester;
import com.app.myorbit.academic.domain.Subject;
import com.app.myorbit.academic.domain.SubjectAtRiskEvent;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AcademicReminderServiceTest {
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 7);
    private static final LocalDateTime NOW = TODAY.atTime(8, 0);

    private final EvaluationAgendaService agenda = mock(EvaluationAgendaService.class);
    private final AcademicSummaryService summary = mock(AcademicSummaryService.class);
    private final SemesterService semesters = mock(SemesterService.class);
    private final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    private final AcademicReminderService service = new AcademicReminderService(agenda, summary, semesters, events);

    private static Evaluation evaluation(String id, String name, Double grade, LocalDateTime due) {
        Evaluation evaluation = new Evaluation();
        evaluation.setId(id);
        evaluation.update(name, 30, grade, due);
        return evaluation;
    }

    private static Subject subject(String name) {
        Subject subject = new Subject();
        subject.update(name, 3, "2026-2", "#fff");
        return subject;
    }

    @Test
    void examsSoonSkipsAlreadyGradedEvaluations() {
        Evaluation pending = evaluation("e1", "Parcial 1", null, NOW.plusDays(2));
        Evaluation graded = evaluation("e2", "Quiz", 4.0, NOW.plusDays(1));
        when(agenda.listWithDue("u1", NOW, NOW.plusDays(3))).thenReturn(
                List.of(new AgendaItem(graded, subject("Cálculo")), new AgendaItem(pending, subject("Cálculo"))));

        assertEquals(1, service.publishExamsSoon("u1", NOW, NOW.plusDays(3)));
        verify(events).publishEvent(new ExamSoonEvent("u1", "e1", "Parcial 1", "Cálculo", NOW.plusDays(2)));
    }

    private Semester semester(String name, LocalDate start, LocalDate end) {
        Semester semester = new Semester();
        semester.update(name, start, end);
        return semester;
    }

    private AcademicSummary summaryWith(SubjectStanding... atRisk) {
        return new AcademicSummary(null, 0, 0, 3.0, List.of(atRisk), List.of(atRisk));
    }

    @Test
    void atRiskOnlyReportsSubjectsOfTheCurrentSemester() {
        when(semesters.listByUser("u1")).thenReturn(List.of(
                semester("2026-2", LocalDate.of(2026, 8, 1), LocalDate.of(2026, 12, 15)),
                semester("2026-1", LocalDate.of(2026, 1, 1), LocalDate.of(2026, 6, 1))));
        when(summary.summarize("u1", null, null)).thenReturn(summaryWith(
                new SubjectStanding("s1", "Cálculo", 3, "2026-2", null, true),
                new SubjectStanding("s0", "Física", 3, "2026-1", null, true)));

        assertEquals(1, service.publishSubjectsAtRisk("u1", TODAY));
        verify(events).publishEvent(new SubjectAtRiskEvent("u1", "s1", "Cálculo"));
    }

    @Test
    void atRiskDoesNothingWithoutACurrentSemester() {
        when(semesters.listByUser("u1")).thenReturn(List.of(semester("2026-2", null, null)));

        assertEquals(0, service.publishSubjectsAtRisk("u1", TODAY));
        verify(summary, never()).summarize(any(), any(), any());
        verify(events, never()).publishEvent(any(Object.class));
    }
}
