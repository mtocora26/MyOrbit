package com.app.myorbit.academic.application;

import com.app.myorbit.academic.domain.Evaluation;
import com.app.myorbit.academic.domain.Subject;
import com.app.myorbit.academic.infrastructure.EvaluationRepository;
import com.app.myorbit.shared.error.BusinessRuleException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Evaluaciones con fecha de todas las materias del usuario, listas para la Agenda. */
@Service
public class EvaluationAgendaService {
    private final EvaluationRepository evaluationRepository;
    private final SubjectService subjectService;

    public EvaluationAgendaService(EvaluationRepository evaluationRepository, SubjectService subjectService) {
        this.evaluationRepository = evaluationRepository;
        this.subjectService = subjectService;
    }

    /** Evaluación junto a la materia a la que pertenece. */
    public record AgendaItem(Evaluation evaluation, Subject subject) {
    }

    /**
     * Evaluaciones con fecha dentro de [from, to] (extremos opcionales), de la más próxima a la más lejana.
     * Las que no tienen fecha no aparecen: no pueden ubicarse en la agenda.
     */
    public List<AgendaItem> listWithDue(String userId, LocalDateTime from, LocalDateTime to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BusinessRuleException("El rango de fechas no es valido: from no puede ser posterior a to");
        }
        Map<String, Subject> subjects = subjectService.listByUser(userId).stream()
                .collect(Collectors.toMap(Subject::getId, Function.identity()));
        return evaluationRepository.findByUserId(userId).stream()
                .filter(evaluation -> evaluation.getDue() != null && subjects.containsKey(evaluation.getSubjectId()))
                .filter(evaluation -> from == null || !evaluation.getDue().isBefore(from))
                .filter(evaluation -> to == null || !evaluation.getDue().isAfter(to))
                .sorted(Comparator.comparing(Evaluation::getDue))
                .map(evaluation -> new AgendaItem(evaluation, subjects.get(evaluation.getSubjectId())))
                .toList();
    }
}
