package com.app.myorbit.academic.application;

import com.app.myorbit.academic.domain.Evaluation;
import com.app.myorbit.academic.domain.Semester;
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
    private final SemesterService semesterService;

    public AcademicSummaryService(SubjectService subjectService, EvaluationRepository evaluationRepository,
                                  GradeSummaryService gradeSummaryService, GradeStrategy strategy, SemesterService semesterService) {
        this.subjectService = subjectService;
        this.evaluationRepository = evaluationRepository;
        this.gradeSummaryService = gradeSummaryService;
        this.strategy = strategy;
        this.semesterService = semesterService;
    }

    /**
     * Sin semestre incluye todas las materias. La meta del resumen es el parámetro si viene; si no, la del semestre
     * (si se filtra por uno que la tiene); si no, la del perfil o 3,0. Cada materia usa la suya si la tiene.
     */
    public AcademicSummary summarize(String userId, String semester, Double target) {
        boolean filtered = semester != null && !semester.isBlank();
        Double semesterTarget = filtered ? semesterService.find(userId, semester).map(Semester::getTargetAverage).orElse(null) : null;
        double goal = gradeSummaryService.resolveTarget(userId, target != null ? target : semesterTarget);
        Map<String, List<Evaluation>> bySubject = evaluationRepository.findByUserId(userId).stream()
                .collect(Collectors.groupingBy(Evaluation::getSubjectId));
        AcademicSummary.Builder builder = AcademicSummary.builder(goal);
        for (Subject subject : subjectService.listByUser(userId)) {
            if (semester != null && !semester.isBlank() && !subject.getSemester().equals(semester)) continue;
            double subjectGoal = subject.getTargetGrade() != null ? subject.getTargetGrade() : goal;
            GradeSummary grades = strategy.calculate(bySubject.getOrDefault(subject.getId(), List.of()), subjectGoal, subject.effectivePassingGrade());
            builder.addSubject(subject.getId(), subject.getName(), subject.getCredits(), subject.getSemester(), grades);
        }
        return builder.build();
    }
}
