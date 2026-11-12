package com.app.myorbit.academic.application;

import com.app.myorbit.academic.domain.Evaluation;
import com.app.myorbit.academic.domain.Semester;
import com.app.myorbit.academic.domain.Subject;
import com.app.myorbit.academic.infrastructure.EvaluationRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GoalsCalculationTest {
    private final WeightedGradeStrategy strategy = new WeightedGradeStrategy();

    private Evaluation evaluation(String subjectId, double percentage, Double grade) {
        Evaluation evaluation = new Evaluation();
        evaluation.setSubjectId(subjectId);
        evaluation.update("E", percentage, grade);
        return evaluation;
    }

    @Test
    void targetAndPassingAreMeasuredSeparately() {
        // 50 % calificado con 3,0 → 1,5 puntos; falta el 50 %.
        GradeSummary summary = strategy.calculate(List.of(evaluation("s1", 50, 3.0), evaluation("s1", 50, null)), 4.0, 3.0);

        assertEquals(5.0, summary.requiredGrade());
        assertTrue(summary.achievable());
        assertEquals(3.0, summary.requiredToPass());
        assertEquals(3.0, summary.passingGrade());
        assertTrue(summary.canPass());
    }

    @Test
    void canPassWhileMissingTheTarget() {
        GradeSummary summary = strategy.calculate(List.of(evaluation("s1", 50, 2.0), evaluation("s1", 50, null)), 4.5, 3.0);

        assertFalse(summary.achievable());
        assertTrue(summary.canPass());
        assertEquals(4.0, summary.requiredToPass());
    }

    @Test
    void completedSubjectBelowPassingCannotPass() {
        GradeSummary summary = strategy.calculate(List.of(evaluation("s1", 100, 2.5)), 3.5, 3.0);

        assertNull(summary.requiredToPass());
        assertFalse(summary.canPass());
    }

    @Test
    void twoArgumentCalculationKeepsPassingEqualToTheTarget() {
        GradeSummary summary = strategy.calculate(List.of(evaluation("s1", 50, 4.0)), 3.5);

        assertEquals(3.5, summary.passingGrade());
        assertEquals(summary.requiredGrade(), summary.requiredToPass());
    }

    @Test
    void riskIsMeasuredAgainstThePassingGradeNotTheTarget() {
        Subject ambitious = subject("s1", 4.8, null);
        Subject safe = subject("s2", null, null);
        // Ambas con 50 % calificado en 4,0: aprueban holgadas; la meta 4,8 exigiría 5,6 (>5), pero no está en riesgo de reprobar.
        EvaluationRepository evaluations = mock(EvaluationRepository.class);
        when(evaluations.findByUserId("u1")).thenReturn(List.of(
                evaluation("s1", 50, 4.0), evaluation("s1", 50, null), evaluation("s2", 50, 4.0), evaluation("s2", 50, null)));
        SubjectService subjects = mock(SubjectService.class);
        when(subjects.listByUser("u1")).thenReturn(List.of(ambitious, safe));
        GradeSummaryService targets = mock(GradeSummaryService.class);
        when(targets.resolveTarget(eq("u1"), any())).thenReturn(3.0);
        AcademicSummaryService service = new AcademicSummaryService(subjects, evaluations, targets, strategy, mock(SemesterService.class));

        AcademicSummary summary = service.summarize("u1", null, null);

        assertTrue(summary.atRisk().isEmpty());
        assertFalse(summary.subjects().get(0).grades().achievable());
        assertTrue(summary.subjects().get(0).grades().canPass());
        assertEquals(4.8, summary.subjects().get(0).grades().targetGrade());
        assertEquals(3.0, summary.subjects().get(1).grades().targetGrade());
    }

    @Test
    void aSubjectThatCannotReachItsPassingGradeIsAtRisk() {
        EvaluationRepository evaluations = mock(EvaluationRepository.class);
        when(evaluations.findByUserId("u1")).thenReturn(List.of(evaluation("s1", 80, 1.0), evaluation("s1", 20, null)));
        SubjectService subjects = mock(SubjectService.class);
        when(subjects.listByUser("u1")).thenReturn(List.of(subject("s1", null, 3.5)));
        GradeSummaryService targets = mock(GradeSummaryService.class);
        when(targets.resolveTarget(eq("u1"), any())).thenReturn(3.0);
        AcademicSummaryService service = new AcademicSummaryService(subjects, evaluations, targets, strategy, mock(SemesterService.class));

        assertEquals(1, service.summarize("u1", null, null).atRisk().size());
    }

    @Test
    void theSemesterTargetIsTheSummaryGoalUnlessAParameterOverridesIt() {
        EvaluationRepository evaluations = mock(EvaluationRepository.class);
        when(evaluations.findByUserId("u1")).thenReturn(List.of());
        SubjectService subjects = mock(SubjectService.class);
        when(subjects.listByUser("u1")).thenReturn(List.of(subject("s1", null, null)));
        GradeSummaryService targets = mock(GradeSummaryService.class);
        when(targets.resolveTarget("u1", 4.2)).thenReturn(4.2);
        when(targets.resolveTarget("u1", 3.9)).thenReturn(3.9);
        SemesterService semesters = mock(SemesterService.class);
        Semester semester = new Semester();
        semester.update("2026-1", null, null, 4.2);
        when(semesters.find("u1", "2026-1")).thenReturn(Optional.of(semester));
        AcademicSummaryService service = new AcademicSummaryService(subjects, evaluations, targets, strategy, semesters);

        assertEquals(4.2, service.summarize("u1", "2026-1", null).targetGrade());
        assertEquals(3.9, service.summarize("u1", "2026-1", 3.9).targetGrade());
        assertEquals(4.2, service.summarize("u1", "2026-1", null).subjects().get(0).grades().targetGrade());
    }

    private Subject subject(String id, Double target, Double passing) {
        Subject subject = new Subject();
        subject.setId(id);
        subject.setUserId("u1");
        subject.update("Materia " + id, 3, "2026-1", "#2E90FA", target, passing);
        return subject;
    }
}
