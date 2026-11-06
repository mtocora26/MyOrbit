package com.app.myorbit.academic.application;

import com.app.myorbit.academic.api.EvaluationRequest;
import com.app.myorbit.academic.domain.Evaluation;
import com.app.myorbit.academic.infrastructure.EvaluationRepository;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.NotFoundException;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EvaluationServiceTest {
    private final EvaluationRepository repository = mock(EvaluationRepository.class);
    private final SubjectService subjects = mock(SubjectService.class);
    private final EvaluationService service = new EvaluationService(repository, subjects);

    private Evaluation evaluation(String id, String userId, String subjectId, double percentage, Double grade) {
        Evaluation evaluation = new Evaluation();
        evaluation.setId(id);
        evaluation.setUserId(userId);
        evaluation.setSubjectId(subjectId);
        evaluation.update("Eval " + id, percentage, grade);
        return evaluation;
    }

    @Test
    void createAssignsOwnerAndSubject() {
        when(repository.findByUserIdAndSubjectId("u1", "s1")).thenReturn(List.of(evaluation("e1", "u1", "s1", 60, 4.0)));
        when(repository.save(any(Evaluation.class))).then(returnsFirstArg());

        Evaluation created = service.create("u1", "s1", new EvaluationRequest("Final", 40.0, null));

        assertEquals("u1", created.getUserId());
        assertEquals("s1", created.getSubjectId());
    }

    @Test
    void createRejectsPercentagesAbove100() {
        when(repository.findByUserIdAndSubjectId("u1", "s1")).thenReturn(List.of(evaluation("e1", "u1", "s1", 70, null)));

        assertThrows(BusinessRuleException.class, () -> service.create("u1", "s1", new EvaluationRequest("Final", 30.5, null)));
        verify(repository, never()).save(any());
    }

    @Test
    void updateIgnoresItsOwnPercentageWhenSumming() {
        Evaluation existing = evaluation("e1", "u1", "s1", 70, null);
        when(repository.findById("e1")).thenReturn(Optional.of(existing));
        when(repository.findByUserIdAndSubjectId("u1", "s1")).thenReturn(List.of(existing, evaluation("e2", "u1", "s1", 30, null)));
        when(repository.save(any(Evaluation.class))).then(returnsFirstArg());

        assertEquals(70, service.update("u1", "s1", "e1", new EvaluationRequest("Parcial", 70.0, 3.5)).getPercentage());
        assertThrows(BusinessRuleException.class, () -> service.update("u1", "s1", "e1", new EvaluationRequest("Parcial", 70.1, null)));
    }

    @Test
    void evaluationsOfOtherSubjectsOrUsersAreNotFound() {
        when(repository.findById("e1")).thenReturn(Optional.of(evaluation("e1", "u2", "s1", 30, null)));
        when(repository.findById("e2")).thenReturn(Optional.of(evaluation("e2", "u1", "s9", 30, null)));

        assertThrows(NotFoundException.class, () -> service.delete("u1", "s1", "e1"));
        assertThrows(NotFoundException.class, () -> service.getOwned("u1", "s1", "e2"));
        verify(repository, never()).deleteById(anyString());
    }

    @Test
    void unknownSubjectIsNotFound() {
        when(subjects.getOwned("u1", "nope")).thenThrow(new NotFoundException("Materia no encontrada"));

        assertThrows(NotFoundException.class, () -> service.list("u1", "nope"));
    }
}
