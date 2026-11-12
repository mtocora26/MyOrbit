package com.app.myorbit.academic.application;

import com.app.myorbit.academic.api.EvaluationComponentRequest;
import com.app.myorbit.academic.api.EvaluationRequest;
import com.app.myorbit.academic.domain.Evaluation;
import com.app.myorbit.academic.infrastructure.EvaluationRepository;
import com.app.myorbit.shared.error.BusinessRuleException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EvaluationServiceComponentsTest {
    private final EvaluationRepository repository = mock(EvaluationRepository.class);
    private final SubjectService subjects = mock(SubjectService.class);
    private final EvaluationService service = new EvaluationService(repository, subjects);

    @Test
    void createStoresTheComponentsOfTheCut() {
        when(repository.findByUserIdAndSubjectId("u1", "s1")).thenReturn(List.of());
        when(repository.save(any(Evaluation.class))).then(returnsFirstArg());

        Evaluation created = service.create("u1", "s1", new EvaluationRequest("Corte 1", 30.0, null, null, List.of(
                new EvaluationComponentRequest("Parcial", 70.0, 4.0), new EvaluationComponentRequest("Actividades", 30.0, 3.0))));

        assertEquals(2, created.getComponents().size());
        assertEquals(3.7, created.effectiveGrade(), 1e-9);
    }

    @Test
    void createRejectsADirectGradeTogetherWithComponents() {
        when(repository.findByUserIdAndSubjectId("u1", "s1")).thenReturn(List.of());

        assertThrows(BusinessRuleException.class, () -> service.create("u1", "s1", new EvaluationRequest("Corte 1", 30.0, 4.0, null,
                List.of(new EvaluationComponentRequest("Parcial", 100.0, 4.0)))));
        verify(repository, never()).save(any());
    }

    @Test
    void createRejectsComponentsAbove100PercentOfTheCut() {
        when(repository.findByUserIdAndSubjectId("u1", "s1")).thenReturn(List.of());

        assertThrows(BusinessRuleException.class, () -> service.create("u1", "s1", new EvaluationRequest("Corte 1", 30.0, null, null,
                List.of(new EvaluationComponentRequest("A", 70.0, null), new EvaluationComponentRequest("B", 40.0, null)))));
    }

    @Test
    void createWithoutComponentsBehavesAsBefore() {
        when(repository.findByUserIdAndSubjectId("u1", "s1")).thenReturn(List.of());
        when(repository.save(any(Evaluation.class))).then(returnsFirstArg());

        Evaluation created = service.create("u1", "s1", new EvaluationRequest("Final", 40.0, 4.5));

        assertFalse(created.hasComponents());
        assertEquals(4.5, created.effectiveGrade());
    }
}
