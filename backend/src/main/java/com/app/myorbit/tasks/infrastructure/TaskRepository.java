package com.app.myorbit.tasks.infrastructure;

import com.app.myorbit.tasks.domain.Task;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TaskRepository extends MongoRepository<Task, String> {
    List<Task> findByUserIdOrderByIdAsc(String userId);
}