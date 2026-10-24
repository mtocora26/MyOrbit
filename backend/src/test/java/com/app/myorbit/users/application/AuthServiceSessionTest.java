package com.app.myorbit.users.application;

import com.app.myorbit.shared.error.UnauthorizedException;
import com.app.myorbit.users.api.LoginRequest;
import com.app.myorbit.users.api.AuthResponse;
import com.app.myorbit.users.domain.User;
import com.app.myorbit.users.domain.UserSession;
import com.app.myorbit.users.infrastructure.UserRepository;
import com.app.myorbit.users.infrastructure.UserSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceSessionTest {
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
        user.setEmail("ana@uni.edu");
        user.setPasswordHash("hash");
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
    }

    private UserSession sessionExpiringAt(Instant expiresAt) {
        UserSession session = new UserSession();
        session.setToken("tok");
        session.setUserId("u1");
        session.setExpiresAt(expiresAt);
        when(sessionRepository.findById("tok")).thenReturn(Optional.of(session));
        return session;
    }

    @Test
    void loginCreatesSessionThatExpiresInThirtyDays() {
        when(userRepository.findByEmailIgnoreCase("ana@uni.edu")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secreto123", "hash")).thenReturn(true);

        AuthResponse response = service.login(new LoginRequest("ana@uni.edu", "secreto123"));

        ArgumentCaptor<UserSession> saved = ArgumentCaptor.forClass(UserSession.class);
        verify(sessionRepository).save(saved.capture());
        assertEquals(NOW.plus(Duration.ofDays(30)), saved.getValue().getExpiresAt());
        assertEquals(saved.getValue().getToken(), response.token());
    }

    @Test
    void validSessionResolvesUser() {
        sessionExpiringAt(NOW.plusSeconds(60));

        assertSame(user, service.requireUser("Bearer tok"));
    }

    @Test
    void expiredSessionIsRejectedAndDeleted() {
        UserSession session = sessionExpiringAt(NOW.minusSeconds(1));

        assertThrows(UnauthorizedException.class, () -> service.requireUser("Bearer tok"));
        verify(sessionRepository).delete(session);
    }

    @Test
    void sessionWithoutExpirationIsTreatedAsExpired() {
        sessionExpiringAt(null);

        assertThrows(UnauthorizedException.class, () -> service.requireUser("Bearer tok"));
        verify(userRepository, never()).findById(any());
    }
}
