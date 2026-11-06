package com.app.myorbit.academic.infrastructure;

import com.app.myorbit.academic.domain.Evaluation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface EvaluationRepository extends MongoRepository<Evaluation, String> {
    List<Evaluation> findByUserIdAndSubjectId(String userId, String subjectId);

    List<Evaluation> findByUserId(String userId);

    void deleteBySubjectId(String subjectId);
}
