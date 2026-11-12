package com.app.myorbit.events.infrastructure;

import com.app.myorbit.events.domain.CalendarEvent;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CalendarEventRepository extends MongoRepository<CalendarEvent, String> {
    List<CalendarEvent> findByUserId(String userId);

    List<CalendarEvent> findByUserIdAndSubjectId(String userId, String subjectId);

    List<CalendarEvent> findByUserIdAndCategoryId(String userId, String categoryId);
}
