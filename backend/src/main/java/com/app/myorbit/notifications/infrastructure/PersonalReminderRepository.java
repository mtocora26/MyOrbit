package com.app.myorbit.notifications.infrastructure;

import com.app.myorbit.notifications.domain.PersonalReminder;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface PersonalReminderRepository extends MongoRepository<PersonalReminder, String> {
    List<PersonalReminder> findByUserIdAndFiredFalseOrderByRemindAtAsc(String userId);

    List<PersonalReminder> findByUserIdAndFiredFalseAndRemindAtLessThanEqual(String userId, LocalDateTime now);
}
