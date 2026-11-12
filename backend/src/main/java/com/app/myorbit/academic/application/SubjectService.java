package com.app.myorbit.academic.application;

import com.app.myorbit.academic.api.SubjectRequest;
import com.app.myorbit.academic.domain.ClassSlot;
import com.app.myorbit.academic.domain.Evaluation;
import com.app.myorbit.academic.domain.Subject;
import com.app.myorbit.academic.domain.SubjectDeletedEvent;
import com.app.myorbit.academic.infrastructure.EvaluationRepository;
import com.app.myorbit.academic.infrastructure.SubjectRepository;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.NotFoundException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class SubjectService {
    static final String DEFAULT_COLOR = "#7A5AF8";
    static final double[] DEFAULT_CUT_PERCENTAGES = {30, 30, 40};
    private final SubjectRepository subjectRepository;
    private final EvaluationRepository evaluationRepository;
    private final SemesterService semesterService;
    private final ApplicationEventPublisher events;

    public SubjectService(SubjectRepository subjectRepository, EvaluationRepository evaluationRepository, SemesterService semesterService,
                          ApplicationEventPublisher events) {
        this.subjectRepository = subjectRepository;
        this.evaluationRepository = evaluationRepository;
        this.semesterService = semesterService;
        this.events = events;
    }

    public List<Subject> listByUser(String userId) {
        return subjectRepository.findByUserIdOrderBySemesterDescNameAsc(userId);
    }

    public Subject getOwned(String userId, String id) {
        return subjectRepository.findById(id)
                .filter(subject -> subject.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("Materia no encontrada"));
    }

    public Subject create(String userId, SubjectRequest request) {
        ensureUniqueName(userId, request, null);
        Subject subject = new Subject();
        subject.setId(UUID.randomUUID().toString());
        subject.setUserId(userId);
        apply(subject, request);
        semesterService.ensureExists(userId, subject.getSemester());
        Subject saved = subjectRepository.save(subject);
        if (Boolean.TRUE.equals(request.defaultCuts())) createDefaultCuts(userId, saved.getId());
        return saved;
    }

    /** Los tres cortes por defecto (30/30/40); el usuario los edita después como cualquier evaluación. */
    private void createDefaultCuts(String userId, String subjectId) {
        List<Evaluation> cuts = new ArrayList<>();
        for (int index = 0; index < DEFAULT_CUT_PERCENTAGES.length; index++) {
            Evaluation cut = new Evaluation();
            cut.setId(UUID.randomUUID().toString());
            cut.setUserId(userId);
            cut.setSubjectId(subjectId);
            cut.update("Corte " + (index + 1), DEFAULT_CUT_PERCENTAGES[index], null);
            cuts.add(cut);
        }
        evaluationRepository.saveAll(cuts);
    }

    public Subject update(String userId, String id, SubjectRequest request) {
        Subject subject = getOwned(userId, id);
        ensureUniqueName(userId, request, id);
        apply(subject, request);
        semesterService.ensureExists(userId, subject.getSemester());
        return subjectRepository.save(subject);
    }

    public void delete(String userId, String id) {
        getOwned(userId, id);
        evaluationRepository.deleteBySubjectId(id);
        subjectRepository.deleteById(id);
        // Las tareas vinculadas se conservan; solo pierden el vínculo (las escucha el módulo de tareas).
        events.publishEvent(new SubjectDeletedEvent(userId, id));
    }

    private void ensureUniqueName(String userId, SubjectRequest request, String excludedId) {
        boolean taken = subjectRepository.findByUserIdAndSemester(userId, request.semester()).stream()
                .anyMatch(subject -> !subject.getId().equals(excludedId) && subject.hasName(request.name()));
        if (taken) throw new BusinessRuleException("Ya tienes una materia con ese nombre en el semestre " + request.semester());
    }

    private void apply(Subject subject, SubjectRequest request) {
        String color = request.color() == null || request.color().isBlank() ? DEFAULT_COLOR : request.color();
        try {
            List<ClassSlot> schedule = request.schedule() == null ? List.of() : request.schedule().stream()
                    .map(slot -> ClassSlot.of(slot.dayOfWeek(), slot.start(), slot.end(), slot.room()))
                    .toList();
            subject.update(request.name(), request.credits(), request.semester(), color, request.targetGrade(), request.passingGrade(), schedule);
        } catch (IllegalArgumentException invalid) {
            throw new BusinessRuleException(invalid.getMessage());
        }
    }
}
