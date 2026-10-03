package com.app.myorbit.users.infrastructure;

import com.app.myorbit.users.domain.UserSession;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserSessionRepository extends MongoRepository<UserSession, String> {
}