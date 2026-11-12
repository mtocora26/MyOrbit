package com.app.myorbit.academic.application;

import com.app.myorbit.academic.api.SubjectRequest;
import com.app.myorbit.academic.domain.Evaluation;
import com.app.myorbit.academic.domain.Subject;
import com.app.myorbit.academic.infrastructure.EvaluationRepository;
import com.app.myorbit.academic.infrastructure.SubjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SubjectServiceDefaultCutsTest {
    private final SubjectRepository repository = mock(SubjectRepository.class);
    private final EvaluationRepository evaluations = mock(EvaluationRepository.class);
    private final SubjectService service = new SubjectService(repository, evaluations, mock(SemesterService.class));

    @BeforeEach
    void stubRepository() {
        when(repository.findByUserIdAndSemester("u1", "2026-1")).thenReturn(List.of());
        when(repository.save(any(Subject.class))).then(returnsFirstArg());
    }

    @Test
    @SuppressWarnings("unchecked")
    void defaultCutsCreateThreeCutsOfThirtyThirtyForty() {
        Subject created = service.create("u1", new SubjectRequest("Redes", 3, "2026-1", null, true));

        ArgumentCaptor<List<Evaluation>> captor = ArgumentCaptor.forClass(List.class);
        verify(evaluations).saveAll(captor.capture());
        List<Evaluation> cuts = captor.getValue();
        assertEquals(List.of("Corte 1", "Corte 2", "Corte 3"), cuts.stream().map(Evaluation::getName).toList());
        assertEquals(List.of(30.0, 30.0, 40.0), cuts.stream().map(Evaluation::getPercentage).toList());
        assertEquals(List.of(created.getId()), cuts.stream().map(Evaluation::getSubjectId).distinct().toList());
        assertEquals(List.of("u1"), cuts.stream().map(Evaluation::getUserId).distinct().toList());
    }

    @Test
    void noCutsAreCreatedByDefault() {
        service.create("u1", new SubjectRequest("Redes", 3, "2026-1", null));
        service.create("u1", new SubjectRequest("Redes II", 3, "2026-1", null, false));

        verify(evaluations, never()).saveAll(anyIterable());
    }
}
