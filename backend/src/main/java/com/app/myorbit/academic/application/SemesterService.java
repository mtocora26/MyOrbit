package com.app.myorbit.academic.application;

import com.app.myorbit.academic.api.SemesterRequest;
import com.app.myorbit.academic.domain.Semester;
import com.app.myorbit.academic.domain.Subject;
import com.app.myorbit.academic.infrastructure.SemesterRepository;
import com.app.myorbit.academic.infrastructure.SubjectRepository;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.NotFoundException;
import com.app.myorbit.users.application.UserZoneService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class SemesterService {
    private final SemesterRepository semesterRepository;
    private final SubjectRepository subjectRepository;
    private final UserZoneService userZoneService;

    public SemesterService(SemesterRepository semesterRepository, SubjectRepository subjectRepository, UserZoneService userZoneService) {
        this.semesterRepository = semesterRepository;
        this.subjectRepository = subjectRepository;
        this.userZoneService = userZoneService;
    }

    public List<Semester> listByUser(String userId) {
        return semesterRepository.findByUserIdOrderByNameDesc(userId);
    }

    /** Hoy para el usuario, para marcar cuál es el semestre en curso. */
    public LocalDate today(String userId) {
        return userZoneService.today(userId);
    }

    public Semester getOwned(String userId, String id) {
        return semesterRepository.findById(id)
                .filter(semester -> semester.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("Semestre no encontrado"));
    }

    public Semester create(String userId, SemesterRequest request) {
        ensureUniqueName(userId, request.name(), null);
        Semester semester = new Semester();
        semester.setId(UUID.randomUUID().toString());
        semester.setUserId(userId);
        apply(semester, request);
        return semesterRepository.save(semester);
    }

    /** Si cambia el nombre, las materias que lo usan se mueven al nuevo (están enlazadas por nombre). */
    public Semester update(String userId, String id, SemesterRequest request) {
        Semester semester = getOwned(userId, id);
        String oldName = semester.getName();
        ensureUniqueName(userId, request.name(), id);
        apply(semester, request);
        Semester saved = semesterRepository.save(semester);
        if (!oldName.equals(saved.getName())) {
            List<Subject> linked = subjectRepository.findByUserIdAndSemester(userId, oldName);
            linked.forEach(subject -> subject.moveToSemester(saved.getName()));
            subjectRepository.saveAll(linked);
        }
        return saved;
    }

    public void delete(String userId, String id) {
        Semester semester = getOwned(userId, id);
        if (!subjectRepository.findByUserIdAndSemester(userId, semester.getName()).isEmpty()) {
            throw new BusinessRuleException("El semestre " + semester.getName() + " tiene materias; elimínalas o muévelas antes de borrarlo");
        }
        semesterRepository.deleteById(id);
    }

    /** Crea el semestre (sin fechas) si el usuario aún no lo tiene. Lo usan las materias y la migración de arranque. */
    public Semester ensureExists(String userId, String name) {
        return semesterRepository.findByUserIdAndName(userId, name).orElseGet(() -> {
            Semester semester = new Semester();
            semester.setId(UUID.randomUUID().toString());
            semester.setUserId(userId);
            semester.update(name, null, null);
            return semesterRepository.save(semester);
        });
    }

    private void ensureUniqueName(String userId, String name, String excludedId) {
        boolean taken = semesterRepository.findByUserIdAndName(userId, name.trim())
                .filter(semester -> !semester.getId().equals(excludedId)).isPresent();
        if (taken) throw new BusinessRuleException("Ya tienes el semestre " + name.trim());
    }

    private void apply(Semester semester, SemesterRequest request) {
        try {
            semester.update(request.name(), request.startDate(), request.endDate());
        } catch (IllegalArgumentException invalid) {
            throw new BusinessRuleException(invalid.getMessage());
        }
    }
}
