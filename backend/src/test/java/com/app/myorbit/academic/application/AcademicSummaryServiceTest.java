package com.app.myorbit.academic.application;

import com.app.myorbit.academic.domain.Evaluation;
import com.app.myorbit.academic.domain.Subject;
import com.app.myorbit.academic.infrastructure.EvaluationRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AcademicSummaryServiceTest {
    private final SubjectService subjects = mock(SubjectService.class);
    private final EvaluationRepository evaluations = mock(EvaluationRepository.class);
    private final GradeSummaryService targets = mock(GradeSummaryService.class);
    private final AcademicSummaryService service = new AcademicSummaryService(subjects, evaluations, targets, new WeightedGradeStrategy());

    private Subject subject(String id, int credits, String semester) {
        Subject subject = new Subject();
        subject.setId(id);
        subject.setUserId("u1");
        subject.update("Materia " + id, credits, semester, "#2E90FA");
        return subject;
    }

    private Evaluation evaluation(String subjectId, double percentage, Double grade) {
        Evaluation evaluation = new Evaluation();
        evaluation.setSubjectId(subjectId);
        evaluation.update("E", percentage, grade);
        return evaluation;
    }

    @Test
    void groupsEvaluationsBySubjectAndFiltersBySemester() {
        when(targets.resolveTarget("u1", null)).thenReturn(3.0);
        when(subjects.listByUser("u1")).thenReturn(List.of(subject("s1", 4, "2026-1"), subject("s2", 2, "2025-2")));
        when(evaluations.findByUserId("u1")).thenReturn(List.of(evaluation("s1", 50, 4.0), evaluation("s2", 50, 2.0)));

        AcademicSummary all = service.summarize("u1", null, null);
        AcademicSummary current = service.summarize("u1", "2026-1", null);

        assertEquals(2, all.subjects().size());
        assertEquals(3.33, all.weightedAverage());
        assertEquals(1, current.subjects().size());
        assertEquals(4.0, current.weightedAverage());
    }
}
