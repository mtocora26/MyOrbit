package com.app.myorbit.academic.application;

import com.app.myorbit.academic.api.EvaluationRequest;
import com.app.myorbit.academic.domain.Evaluation;
import com.app.myorbit.academic.domain.EvaluationComponent;
import com.app.myorbit.academic.infrastructure.EvaluationRepository;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.time.DueDate;
import com.app.myorbit.shared.error.NotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class EvaluationService {
    private static final double EPSILON = 1e-9;
    private final EvaluationRepository evaluationRepository;
    private final SubjectService subjectService;

    public EvaluationService(EvaluationRepository evaluationRepository, SubjectService subjectService) {
        this.evaluationRepository = evaluationRepository;
        this.subjectService = subjectService;
    }

    public List<Evaluation> list(String userId, String subjectId) {
        subjectService.getOwned(userId, subjectId);
        return evaluationRepository.findByUserIdAndSubjectId(userId, subjectId);
    }

    public Evaluation getOwned(String userId, String subjectId, String id) {
        subjectService.getOwned(userId, subjectId);
        return evaluationRepository.findById(id)
                .filter(evaluation -> evaluation.getUserId().equals(userId) && evaluation.getSubjectId().equals(subjectId))
                .orElseThrow(() -> new NotFoundException("Evaluacion no encontrada"));
    }

    public Evaluation create(String userId, String subjectId, EvaluationRequest request) {
        List<Evaluation> existing = list(userId, subjectId);
        ensurePercentageFits(existing, null, request.percentage());
        Evaluation evaluation = new Evaluation();
        evaluation.setId(UUID.randomUUID().toString());
        evaluation.setUserId(userId);
        evaluation.setSubjectId(subjectId);
        apply(evaluation, request);
        return evaluationRepository.save(evaluation);
    }

    public Evaluation update(String userId, String subjectId, String id, EvaluationRequest request) {
        Evaluation evaluation = getOwned(userId, subjectId, id);
        ensurePercentageFits(evaluationRepository.findByUserIdAndSubjectId(userId, subjectId), id, request.percentage());
        apply(evaluation, request);
        return evaluationRepository.save(evaluation);
    }

    public void delete(String userId, String subjectId, String id) {
        getOwned(userId, subjectId, id);
        evaluationRepository.deleteById(id);
    }

    private void ensurePercentageFits(List<Evaluation> existing, String excludedId, double percentage) {
        double others = existing.stream()
                .filter(evaluation -> !evaluation.getId().equals(excludedId))
                .mapToDouble(Evaluation::getPercentage)
                .sum();
        if (others + percentage > Evaluation.MAX_PERCENTAGE + EPSILON) {
            throw new BusinessRuleException("La suma de porcentajes no puede superar 100%. Disponible: " + format(Evaluation.MAX_PERCENTAGE - others) + "%");
        }
    }

    private String format(double value) {
        return value == Math.rint(value) ? String.valueOf((long) value) : String.format(java.util.Locale.ROOT, "%.2f", value);
    }

    private void apply(Evaluation evaluation, EvaluationRequest request) {
        try {
            List<EvaluationComponent> components = request.components() == null ? List.of() : request.components().stream()
                    .map(component -> EvaluationComponent.of(component.name(), component.percentage(), component.grade()))
                    .toList();
            evaluation.update(request.name(), request.percentage(), request.grade(), DueDate.parse(request.due()), components);
        } catch (IllegalArgumentException invalid) {
            throw new BusinessRuleException(invalid.getMessage());
        }
    }
}
