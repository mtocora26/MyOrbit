package com.app.myorbit.academic.application;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AcademicSummaryTest {
    private GradeSummary grades(Double current, Double required, boolean achievable) {
        return new GradeSummary(current, 0, 0, 0, 3.0, required, achievable);
    }

    @Test
    void averageIsWeightedByCreditsAndIgnoresSubjectsWithoutGrades() {
        AcademicSummary summary = AcademicSummary.builder(3.0)
                .addSubject("s1", "Redes", 4, "2026-1", grades(4.0, 2.0, true))
                .addSubject("s2", "Calculo", 2, "2026-1", grades(3.0, 3.0, true))
                .addSubject("s3", "Etica", 3, "2026-1", grades(null, 3.0, true))
                .build();

        assertEquals(3.67, summary.weightedAverage());
        assertEquals(9, summary.totalCredits());
        assertEquals(6, summary.gradedCredits());
        assertTrue(summary.atRisk().isEmpty());
    }

    @Test
    void withoutGradesThereIsNoAverage() {
        AcademicSummary summary = AcademicSummary.builder(3.0).addSubject("s1", "Redes", 3, "2026-1", grades(null, 3.0, true)).build();

        assertNull(summary.weightedAverage());
    }

    @Test
    void subjectsNeedingMoreThanFourOrUnreachableAreAtRisk() {
        AcademicSummary summary = AcademicSummary.builder(3.0)
                .addSubject("s1", "Ok", 3, "2026-1", grades(4.0, 4.0, true))
                .addSubject("s2", "Exigente", 3, "2026-1", grades(2.0, 4.5, true))
                .addSubject("s3", "Perdida", 3, "2026-1", grades(1.0, 7.0, false))
                .addSubject("s4", "Cerrada", 3, "2026-1", grades(2.0, null, false))
                .build();

        assertEquals(java.util.List.of("s2", "s3", "s4"), summary.atRisk().stream().map(AcademicSummary.SubjectStanding::subjectId).toList());
    }
}
