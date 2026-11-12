package com.app.myorbit.academic.infrastructure;

import com.app.myorbit.academic.domain.Semester;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface SemesterRepository extends MongoRepository<Semester, String> {
    List<Semester> findByUserIdOrderByNameDesc(String userId);

    Optional<Semester> findByUserIdAndName(String userId, String name);
}
