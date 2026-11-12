package com.app.myorbit.academic.application;

import com.app.myorbit.academic.domain.Subject;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.users.application.UserProfileService;
import org.springframework.stereotype.Service;

import java.util.OptionalDouble;

@Service
public class GradeSummaryService {
    public static final double DEFAULT_TARGET = 3.0;
    private final EvaluationService evaluationService;
    private final SubjectService subjectService;
    private final UserProfileService profileService;
    private final GradeStrategy strategy;

    public GradeSummaryService(EvaluationService evaluationService, SubjectService subjectService, UserProfileService profileService, GradeStrategy strategy) {
        this.evaluationService = evaluationService;
        this.subjectService = subjectService;
        this.profileService = profileService;
        this.strategy = strategy;
    }

    /**
     * La meta es el parámetro si viene; si no, la de la materia; si no, la del perfil; si no, {@value #DEFAULT_TARGET}.
     * La nota para aprobar es la de la materia o, si falta, {@value Subject#DEFAULT_PASSING_GRADE}.
     */
    public GradeSummary summarize(String userId, String subjectId, Double target) {
        Subject subject = subjectService.getOwned(userId, subjectId);
        double goal = target != null ? validated(target) : subject.getTargetGrade() != null ? subject.getTargetGrade() : resolveTarget(userId, null);
        return strategy.calculate(evaluationService.list(userId, subjectId), goal, subject.effectivePassingGrade());
    }

    public double resolveTarget(String userId, Double target) {
        return target != null ? validated(target) : profileTarget(userId).orElse(DEFAULT_TARGET);
    }

    private double validated(double target) {
        if (target < 0 || target > 5) throw new BusinessRuleException("La meta debe estar entre 0 y 5");
        return target;
    }

    private OptionalDouble profileTarget(String userId) {
        return profileService.find(userId)
                .map(profile -> profile.getGradeTarget())
                .filter(value -> value != null && !value.isBlank())
                .map(value -> {
                    try {
                        double parsed = Double.parseDouble(value.trim().replace(',', '.'));
                        return parsed >= 0 && parsed <= 5 ? OptionalDouble.of(parsed) : OptionalDouble.empty();
                    } catch (NumberFormatException invalid) {
                        return OptionalDouble.empty();
                    }
                })
                .orElse(OptionalDouble.empty());
    }
}
