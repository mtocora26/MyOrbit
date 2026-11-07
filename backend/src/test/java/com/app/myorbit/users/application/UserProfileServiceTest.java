package com.app.myorbit.users.application;

import com.app.myorbit.users.domain.UserProfile;
import com.app.myorbit.users.infrastructure.UserProfileRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserProfileServiceTest {
    private final UserProfileRepository repository = mock(UserProfileRepository.class);
    private final UserProfileService service = new UserProfileService(repository);

    @Test
    void createsProfileWithTrimmedAndEmptyFields() {
        when(repository.findById("u1")).thenReturn(Optional.empty());
        when(repository.save(any(UserProfile.class))).then(returnsFirstArg());

        UserProfile profile = service.update("u1", "  Ingeniería  ", null, "4.5");

        assertEquals("u1", profile.getUserId());
        assertEquals("Ingeniería", profile.getProgram());
        assertEquals("", profile.getSemester());
        assertEquals("4.5", profile.getGradeTarget());
    }

    @Test
    void findReturnsEmptyWhenNoProfile() {
        when(repository.findById("u2")).thenReturn(Optional.empty());
        assertTrue(service.find("u2").isEmpty());
    }
}
