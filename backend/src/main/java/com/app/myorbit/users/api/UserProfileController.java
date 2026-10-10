package com.app.myorbit.users.api;

import com.app.myorbit.users.domain.User;
import com.app.myorbit.users.domain.UserProfile;
import com.app.myorbit.users.infrastructure.UserProfileRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/profile")
public class UserProfileController {
    private final UserProfileRepository profileRepository;

    public UserProfileController(UserProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    @GetMapping
    public ResponseEntity<UserProfileResponse> get(@CurrentUser User user) {
        return profileRepository.findById(user.getId())
                .map(profile -> ResponseEntity.ok(UserProfileResponse.from(profile)))
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PutMapping
    public UserProfileResponse update(@CurrentUser User user, @RequestBody UpdateUserProfileRequest request) {
        UserProfile profile = profileRepository.findById(user.getId()).orElseGet(UserProfile::new);
        profile.setUserId(user.getId());
        profile.setProgram(textOrEmpty(request.program()));
        profile.setSemester(textOrEmpty(request.semester()));
        profile.setStudentCode(textOrEmpty(request.studentCode()));
        profile.setGradeTarget(textOrEmpty(request.gradeTarget()));
        return UserProfileResponse.from(profileRepository.save(profile));
    }

    private String textOrEmpty(String value) {
        return value == null ? "" : value.trim();
    }
}