package com.app.MyOrbit.habits;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface HabitRepository extends MongoRepository<Habit, String> {
    List<Habit> findByUserIdOrderByTitleAsc(String userId);
}