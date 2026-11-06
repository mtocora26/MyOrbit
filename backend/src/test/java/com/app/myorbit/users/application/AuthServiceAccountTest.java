package com.app.myorbit.users.application;

import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.NotFoundException;
import com.app.myorbit.shared.error.UnauthorizedException;
import com.app.myorbit.users.domain.User;
import com.app.myorbit.users.domain.UserSession;
import com.app.myorbit.users.infrastructure.UserRepository;
import com.app.myorbit.users.infrastructure.UserSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceAccountTest {
    private static final Instant NOW = Instant.parse("2026-10-23T12:00:00Z");

    private UserRepository userRepository;
    private UserSessionRepository sessionRepository;
    private PasswordEncoder passwordEncoder;
    private AuthService service;
    private User user;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        sessionRepository = mock(UserSessionRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        service = new AuthService(userRepository, sessionRepository, passwordEncoder,
                Clock.fixed(NOW, ZoneOffset.UTC), List.of(), Duration.ofDays(30));
        user = new User();
        user.setId("u1");
        user.setName("Ana");
        user.setEmail("ana@uni.edu");
        user.setPasswordHash("hash");
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void updateNameTrimsAndSaves() {
        User updated = service.updateName("u1", "  Ana María  ");

        assertEquals("Ana María", updated.getName());
        verify(userRepository).save(user);
    }

    @Test
    void updateNameRejectsBlank() {
        assertThrows(BusinessRuleException.class, () -> service.updateName("u1", "   "));
        assertThrows(BusinessRuleException.class, () -> service.updateName("u1", null));
        verify(userRepository, never()).save(any());
    }

    @Test
    void updateNameRejectsTooLong() {
        assertThrows(BusinessRuleException.class, () -> service.updateName("u1", "a".repeat(101)));
    }

    @Test
    void updateNameOfUnknownUserIsNotFound() {
        when(userRepository.findById("missing")).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.updateName("missing", "Ana"));
    }

    @Test
    void changePasswordWithWrongCurrentIsUnauthorized() {
        when(passwordEncoder.matches("mal", "hash")).thenReturn(false);

        assertThrows(UnauthorizedException.class,
                () -> service.changePassword("u1", "Bearer tok", "mal", "nueva-secreta"));
    }

    @Test
    void changePasswordRejectsShortNewPassword() {
        assertThrows(BusinessRuleException.class,
                () -> service.changePassword("u1", "Bearer tok", "actual", "corta"));
    }

    @Test
    void changePasswordEncodesAndClosesOtherSessions() {
        when(passwordEncoder.matches("actual", "hash")).thenReturn(true);
        when(passwordEncoder.encode("nueva-secreta")).thenReturn("newhash");
        UserSession current = new UserSession();
        current.setToken("tok");
        current.setUserId("u1");
        UserSession other = new UserSession();
        other.setToken("other");
        other.setUserId("u1");
        when(sessionRepository.findByUserId("u1")).thenReturn(List.of(current, other));

        service.changePassword("u1", "Bearer tok", "actual", "nueva-secreta");

        assertEquals("newhash", user.getPasswordHash());
        verify(sessionRepository).delete(other);
        verify(sessionRepository, never()).delete(current);
    }
}
