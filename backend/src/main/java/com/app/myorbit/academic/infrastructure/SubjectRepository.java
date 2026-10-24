package com.app.myorbit.academic.infrastructure;

import com.app.myorbit.academic.domain.Subject;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SubjectRepository extends MongoRepository<Subject, String> {
    List<Subject> findByUserIdOrderBySemesterDescNameAsc(String userId);

    List<Subject> findByUserIdAndSemester(String userId, String semester);
}
