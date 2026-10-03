package com.app.myorbit.habits.infrastructure;

import com.app.myorbit.habits.domain.Habit;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface HabitRepository extends MongoRepository<Habit, String> {
    List<Habit> findByUserIdOrderByTitleAsc(String userId);
}