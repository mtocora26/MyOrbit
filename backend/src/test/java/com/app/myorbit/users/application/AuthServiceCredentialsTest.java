package com.app.myorbit.users.application;

import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.UnauthorizedException;
import com.app.myorbit.users.api.AuthResponse;
import com.app.myorbit.users.api.LoginRequest;
import com.app.myorbit.users.api.RegisterRequest;
import com.app.myorbit.users.domain.Role;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Registro, login, resolución de la sesión y logout. */
class AuthServiceCredentialsTest {
    private static final Instant NOW = Instant.parse("2026-11-07T12:00:00Z");

    private UserRepository userRepository;
    private UserSessionRepository sessionRepository;
    private PasswordEncoder passwordEncoder;
    private AuthService service;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        sessionRepository = mock(UserSessionRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        service = new AuthService(userRepository, sessionRepository, passwordEncoder,
                Clock.fixed(NOW, ZoneOffset.UTC), List.of(" Admin@Uni.edu "), Duration.ofDays(30));
        when(userRepository.save(any(User.class))).then(returnsFirstArg());
        when(passwordEncoder.encode("clave-segura")).thenReturn("HASH");
    }

    private User existingUser(boolean active) {
        User user = new User();
        user.setId("u1");
        user.setName("Ana");
        user.setEmail("ana@uni.edu");
        user.setPasswordHash("HASH");
        user.setActive(active);
        return user;
    }

    // ---- registro ----

    @Test
    void registerCreatesAnActiveUserWithHashedPasswordAndNormalizedFields() {
        AuthResponse response = service.register(new RegisterRequest("  Ana  ", "  ANA@Uni.EDU ", "clave-segura"));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        User user = saved.getValue();
        assertEquals("Ana", user.getName());
        assertEquals("ana@uni.edu", user.getEmail());
        assertEquals("HASH", user.getPasswordHash());
        assertEquals(Role.USER, user.getRole());
        assertTrue(user.isActive());
        assertEquals(NOW, user.getCreatedAt());
        assertEquals(user.getId(), response.id());
        assertEquals("ana@uni.edu", response.email());
        assertNotNull(response.token());
    }

    @Test
    void registerOpensASessionThatExpiresAfterTheTtl() {
        AuthResponse response = service.register(new RegisterRequest("Ana", "ana@uni.edu", "clave-segura"));

        ArgumentCaptor<UserSession> session = ArgumentCaptor.forClass(UserSession.class);
        verify(sessionRepository).save(session.capture());
        assertEquals(response.token(), session.getValue().getToken());
        assertEquals(NOW.plus(Duration.ofDays(30)), session.getValue().getExpiresAt());
    }

    @Test
    void registerGrantsAdminOnlyToConfiguredEmailsIgnoringCaseAndSpaces() {
        AuthResponse admin = service.register(new RegisterRequest("Root", "ADMIN@uni.edu", "clave-segura"));
        AuthResponse regular = service.register(new RegisterRequest("Ana", "ana@uni.edu", "clave-segura"));

        assertEquals(Role.ADMIN, admin.role());
        assertEquals(Role.USER, regular.role());
    }

    @Test
    void registerRejectsAnEmailAlreadyInUse() {
        when(userRepository.findByEmailIgnoreCase("ana@uni.edu")).thenReturn(Optional.of(existingUser(true)));

        assertThrows(BusinessRuleException.class, () -> service.register(new RegisterRequest("Ana", "Ana@Uni.edu", "clave-segura")));
        verify(userRepository, never()).save(any(User.class));
        verify(sessionRepository, never()).save(any(UserSession.class));
    }

    @Test
    void registerRejectsInvalidData() {
        assertThrows(BusinessRuleException.class, () -> service.register(new RegisterRequest(" ", "ana@uni.edu", "clave-segura")));
        assertThrows(BusinessRuleException.class, () -> service.register(new RegisterRequest("Ana", null, "clave-segura")));
        assertThrows(BusinessRuleException.class, () -> service.register(new RegisterRequest("Ana", "sin-arroba", "clave-segura")));
        assertThrows(BusinessRuleException.class, () -> service.register(new RegisterRequest("Ana", "ana@uni.edu", null)));
        assertThrows(BusinessRuleException.class, () -> service.register(new RegisterRequest("Ana", "ana@uni.edu", "corta")));
        verify(userRepository, never()).save(any(User.class));
    }

    // ---- login ----

    @Test
    void loginWithValidCredentialsOpensASession() {
        when(userRepository.findByEmailIgnoreCase("ana@uni.edu")).thenReturn(Optional.of(existingUser(true)));
        when(passwordEncoder.matches("clave-segura", "HASH")).thenReturn(true);

        AuthResponse response = service.login(new LoginRequest(" ANA@uni.edu ", "clave-segura"));

        assertEquals("u1", response.id());
        assertNotNull(response.token());
        verify(sessionRepository).save(any(UserSession.class));
    }

    @Test
    void loginDoesNotRevealWhetherTheEmailOrThePasswordFailed() {
        when(userRepository.findByEmailIgnoreCase("ana@uni.edu")).thenReturn(Optional.of(existingUser(true)));
        when(passwordEncoder.matches("mala", "HASH")).thenReturn(false);

        UnauthorizedException wrongPassword = assertThrows(UnauthorizedException.class,
                () -> service.login(new LoginRequest("ana@uni.edu", "mala")));
        UnauthorizedException unknownEmail = assertThrows(UnauthorizedException.class,
                () -> service.login(new LoginRequest("otro@uni.edu", "clave-segura")));

        assertEquals(wrongPassword.getMessage(), unknownEmail.getMessage());
        verify(sessionRepository, never()).save(any(UserSession.class));
    }

    @Test
    void loginRejectsDeactivatedAccountsEvenWithTheRightPassword() {
        when(userRepository.findByEmailIgnoreCase("ana@uni.edu")).thenReturn(Optional.of(existingUser(false)));
        when(passwordEncoder.matches("clave-segura", "HASH")).thenReturn(true);

        assertThrows(UnauthorizedException.class, () -> service.login(new LoginRequest("ana@uni.edu", "clave-segura")));
        verify(sessionRepository, never()).save(any(UserSession.class));
    }

    @Test
    void loginRejectsMissingEmail() {
        assertThrows(BusinessRuleException.class, () -> service.login(new LoginRequest(" ", "clave-segura")));
    }

    // ---- requireUser / logout ----

    private void validSession(User user) {
        UserSession session = new UserSession();
        session.setToken("tok");
        session.setUserId(user.getId());
        session.setExpiresAt(NOW.plusSeconds(60));
        when(sessionRepository.findById("tok")).thenReturn(Optional.of(session));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
    }

    @Test
    void requireUserRejectsMissingOrMalformedAuthorizationHeaders() {
        for (String header : new String[]{null, "", "tok", "Basic tok", "bearer tok"}) {
            assertThrows(UnauthorizedException.class, () -> service.requireUser(header), String.valueOf(header));
        }
        verify(sessionRepository, never()).findById(any());
    }

    @Test
    void requireUserRejectsUnknownTokens() {
        when(sessionRepository.findById("tok")).thenReturn(Optional.empty());

        assertThrows(UnauthorizedException.class, () -> service.requireUser("Bearer tok"));
    }

    @Test
    void requireUserRejectsSessionsWhoseUserNoLongerExists() {
        User user = existingUser(true);
        validSession(user);
        when(userRepository.findById("u1")).thenReturn(Optional.empty());

        assertThrows(UnauthorizedException.class, () -> service.requireUser("Bearer tok"));
    }

    @Test
    void requireUserRejectsDeactivatedUsersWithAValidSession() {
        validSession(existingUser(false));

        assertThrows(UnauthorizedException.class, () -> service.requireUser("Bearer tok"));
    }

    @Test
    void requireUserReturnsTheUserOfAValidSession() {
        User user = existingUser(true);
        validSession(user);

        assertSame(user, service.requireUser("Bearer tok"));
    }

    @Test
    void logoutDeletesTheSessionOfTheToken() {
        service.logout("Bearer tok");

        verify(sessionRepository).deleteById("tok");
    }

    @Test
    void logoutWithoutValidHeaderIsUnauthorizedAndDeletesNothing() {
        assertThrows(UnauthorizedException.class, () -> service.logout(null));
        verify(sessionRepository, never()).deleteById(any());
    }
}
