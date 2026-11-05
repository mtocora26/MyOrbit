package com.app.myorbit.academic.application;

import com.app.myorbit.academic.domain.Evaluation;
import com.app.myorbit.academic.domain.Subject;
import com.app.myorbit.academic.infrastructure.EvaluationRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AcademicSummaryService {
    private final SubjectService subjectService;
    private final EvaluationRepository evaluationRepository;
    private final GradeSummaryService gradeSummaryService;
    private final GradeStrategy strategy;

    public AcademicSummaryService(SubjectService subjectService, EvaluationRepository evaluationRepository,
                                  GradeSummaryService gradeSummaryService, GradeStrategy strategy) {
        this.subjectService = subjectService;
        this.evaluationRepository = evaluationRepository;
        this.gradeSummaryService = gradeSummaryService;
        this.strategy = strategy;
    }

    /** Sin semestre incluye todas las materias; la meta sigue la misma precedencia que el resumen por materia. */
    public AcademicSummary summarize(String userId, String semester, Double target) {
        double goal = gradeSummaryService.resolveTarget(userId, target);
        Map<String, List<Evaluation>> bySubject = evaluationRepository.findByUserId(userId).stream()
                .collect(Collectors.groupingBy(Evaluation::getSubjectId));
        AcademicSummary.Builder builder = AcademicSummary.builder(goal);
        for (Subject subject : subjectService.listByUser(userId)) {
            if (semester != null && !semester.isBlank() && !subject.getSemester().equals(semester)) continue;
            GradeSummary grades = strategy.calculate(bySubject.getOrDefault(subject.getId(), List.of()), goal);
            builder.addSubject(subject.getId(), subject.getName(), subject.getCredits(), subject.getSemester(), grades);
        }
        return builder.build();
    }
}
