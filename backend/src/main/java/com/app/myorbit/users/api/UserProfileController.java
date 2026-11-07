package com.app.myorbit.users.api;

import jakarta.validation.Valid;
import com.app.myorbit.users.application.UserProfileService;
import com.app.myorbit.users.domain.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
public class UserProfileController {
    private final UserProfileService profileService;

    public UserProfileController(UserProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ResponseEntity<UserProfileResponse> get(@CurrentUser User user) {
        return profileService.find(user.getId())
                .map(profile -> ResponseEntity.ok(UserProfileResponse.from(profile)))
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PutMapping
    public UserProfileResponse update(@CurrentUser User user, @Valid @RequestBody UpdateUserProfileRequest request) {
        return UserProfileResponse.from(profileService.update(user.getId(), request.program(), request.semester(),
                request.gradeTarget()));
    }
}
