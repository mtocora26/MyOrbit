package com.app.myorbit.academic.application;

import com.app.myorbit.academic.application.EvaluationAgendaService.AgendaItem;
import com.app.myorbit.academic.domain.Evaluation;
import com.app.myorbit.academic.domain.Subject;
import com.app.myorbit.academic.infrastructure.EvaluationRepository;
import com.app.myorbit.shared.error.BusinessRuleException;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class EvaluationAgendaServiceTest {
    private final EvaluationRepository repository = mock(EvaluationRepository.class);
    private final SubjectService subjects = mock(SubjectService.class);
    private final EvaluationAgendaService service = new EvaluationAgendaService(repository, subjects);

    private Subject subject(String id, String name) {
        Subject subject = new Subject();
        subject.setId(id);
        subject.setUserId("u1");
        subject.update(name, 3, "2026-2", "#2E90FA");
        return subject;
    }

    private Evaluation evaluation(String id, String subjectId, LocalDateTime due) {
        Evaluation evaluation = new Evaluation();
        evaluation.setId(id);
        evaluation.setUserId("u1");
        evaluation.setSubjectId(subjectId);
        evaluation.update("Eval " + id, 20, null, due);
        return evaluation;
    }

    private static final LocalDateTime NOV_10 = LocalDateTime.of(2026, 11, 10, 8, 0);
    private static final LocalDateTime NOV_20 = LocalDateTime.of(2026, 11, 20, 8, 0);
    private static final LocalDateTime DEC_01 = LocalDateTime.of(2026, 12, 1, 8, 0);

    @Test
    void listsOnlyDatedEvaluationsOfExistingSubjectsOrderedByDate() {
        when(subjects.listByUser("u1")).thenReturn(List.of(subject("s1", "Redes"), subject("s2", "Cálculo")));
        when(repository.findByUserId("u1")).thenReturn(List.of(
                evaluation("late", "s1", DEC_01),
                evaluation("undated", "s1", null),
                evaluation("orphan", "gone", NOV_10),
                evaluation("early", "s2", NOV_10)));

        List<AgendaItem> items = service.listWithDue("u1", null, null);

        assertEquals(List.of("early", "late"), items.stream().map(item -> item.evaluation().getId()).toList());
        assertEquals("Cálculo", items.get(0).subject().getName());
    }

    @Test
    void filtersByRangeInclusive() {
        when(subjects.listByUser("u1")).thenReturn(List.of(subject("s1", "Redes")));
        when(repository.findByUserId("u1")).thenReturn(List.of(
                evaluation("a", "s1", NOV_10), evaluation("b", "s1", NOV_20), evaluation("c", "s1", DEC_01)));

        assertEquals(List.of("b"), service.listWithDue("u1", NOV_20, NOV_20).stream().map(item -> item.evaluation().getId()).toList());
        assertEquals(List.of("b", "c"), service.listWithDue("u1", NOV_20, null).stream().map(item -> item.evaluation().getId()).toList());
        assertEquals(List.of("a"), service.listWithDue("u1", null, NOV_10).stream().map(item -> item.evaluation().getId()).toList());
    }

    @Test
    void rejectsAnInvertedRange() {
        assertThrows(BusinessRuleException.class, () -> service.listWithDue("u1", DEC_01, NOV_10));
    }
}
