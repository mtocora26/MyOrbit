package com.app.myorbit.tasks.infrastructure;

import com.app.myorbit.tasks.domain.Task;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface TaskRepository extends MongoRepository<Task, String> {
    List<Task> findByUserIdOrderByIdAsc(String userId);

    List<Task> findByDoneFalseAndDueBetween(LocalDateTime from, LocalDateTime to);

    List<Task> findByUserIdAndCategoryId(String userId, String categoryId);
}