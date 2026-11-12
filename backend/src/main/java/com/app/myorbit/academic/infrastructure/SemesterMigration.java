package com.app.myorbit.academic.infrastructure;

import com.app.myorbit.academic.application.SemesterService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Al arrancar crea, para cada usuario, un semestre (sin fechas) por cada texto de semestre que usan sus materias.
 * Es idempotente: no duplica los que ya existen, así que no necesita marca de "ya ejecutada".
 */
@Component
public class SemesterMigration implements ApplicationRunner {
    private final SubjectRepository subjectRepository;
    private final SemesterService semesterService;

    public SemesterMigration(SubjectRepository subjectRepository, SemesterService semesterService) {
        this.subjectRepository = subjectRepository;
        this.semesterService = semesterService;
    }

    @Override
    public void run(ApplicationArguments args) {
        subjectRepository.findAll().stream()
                .filter(subject -> subject.getUserId() != null && subject.getSemester() != null)
                .map(subject -> subject.getUserId() + "\n" + subject.getSemester())
                .distinct()
                .forEach(key -> {
                    String[] parts = key.split("\n", 2);
                    semesterService.ensureExists(parts[0], parts[1]);
                });
    }
}
