package com.app.myorbit.users.application;

import com.app.myorbit.users.domain.UserProfile;
import com.app.myorbit.users.infrastructure.UserProfileRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class UserProfileService {
    private final UserProfileRepository profileRepository;

    public UserProfileService(UserProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    public Optional<UserProfile> find(String userId) {
        return profileRepository.findById(userId);
    }

    public UserProfile update(String userId, String program, String semester, String gradeTarget) {
        UserProfile profile = profileRepository.findById(userId).orElseGet(UserProfile::new);
        profile.setUserId(userId);
        profile.setProgram(textOrEmpty(program));
        profile.setSemester(textOrEmpty(semester));
        profile.setGradeTarget(textOrEmpty(gradeTarget));
        return profileRepository.save(profile);
    }

    private String textOrEmpty(String value) {
        return value == null ? "" : value.trim();
    }
}
