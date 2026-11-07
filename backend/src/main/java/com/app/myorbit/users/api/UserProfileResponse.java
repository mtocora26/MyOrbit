package com.app.myorbit.users.api;

import com.app.myorbit.users.domain.UserProfile;

public record UserProfileResponse(String userId, String program, String semester, String gradeTarget) {
    public static UserProfileResponse from(UserProfile profile) {
        return new UserProfileResponse(profile.getUserId(), profile.getProgram(), profile.getSemester(),
                profile.getGradeTarget());
    }
}
