package com.app.myorbit.academic.application;

import com.app.myorbit.academic.api.SubjectRequest;
import com.app.myorbit.academic.domain.Subject;
import com.app.myorbit.academic.infrastructure.SubjectRepository;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.NotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class SubjectService {
    static final String DEFAULT_COLOR = "#7A5AF8";
    private final SubjectRepository subjectRepository;

    public SubjectService(SubjectRepository subjectRepository) {
        this.subjectRepository = subjectRepository;
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
        return subjectRepository.save(subject);
    }

    public Subject update(String userId, String id, SubjectRequest request) {
        Subject subject = getOwned(userId, id);
        ensureUniqueName(userId, request, id);
        apply(subject, request);
        return subjectRepository.save(subject);
    }

    public void delete(String userId, String id) {
        getOwned(userId, id);
        subjectRepository.deleteById(id);
    }

    private void ensureUniqueName(String userId, SubjectRequest request, String excludedId) {
        boolean taken = subjectRepository.findByUserIdAndSemester(userId, request.semester()).stream()
                .anyMatch(subject -> !subject.getId().equals(excludedId) && subject.hasName(request.name()));
        if (taken) throw new BusinessRuleException("Ya tienes una materia con ese nombre en el semestre " + request.semester());
    }

    private void apply(Subject subject, SubjectRequest request) {
        String color = request.color() == null || request.color().isBlank() ? DEFAULT_COLOR : request.color();
        try {
            subject.update(request.name(), request.credits(), request.semester(), color);
        } catch (IllegalArgumentException invalid) {
            throw new BusinessRuleException(invalid.getMessage());
        }
    }
}
