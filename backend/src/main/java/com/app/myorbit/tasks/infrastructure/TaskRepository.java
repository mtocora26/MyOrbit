package com.app.myorbit.tasks.infrastructure;

import com.app.myorbit.tasks.domain.Task;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface TaskRepository extends MongoRepository<Task, String> {
    List<Task> findByUserIdOrderByIdAsc(String userId);

    List<Task> findByUserIdAndDoneFalseAndDueBetween(String userId, LocalDateTime from, LocalDateTime to);

    List<Task> findByUserIdAndCategoryId(String userId, String categoryId);

    List<Task> findByUserIdAndSubjectId(String userId, String subjectId);
}