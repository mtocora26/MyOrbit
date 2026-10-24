package com.app.myorbit.users.application;

import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.ForbiddenException;
import com.app.myorbit.users.api.AdminUserResponse;
import com.app.myorbit.users.api.CreateUserRequest;
import com.app.myorbit.users.api.UpdateUserRequest;
import com.app.myorbit.users.domain.Role;
import com.app.myorbit.users.domain.User;
import com.app.myorbit.users.infrastructure.UserRepository;
import com.app.myorbit.users.infrastructure.UserSessionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserAdminServiceTest {
    private final UserRepository users = mock(UserRepository.class);
    private final UserSessionRepository sessions = mock(UserSessionRepository.class);
    private final PasswordEncoder encoder = mock(PasswordEncoder.class);
    private final UserAdminService service = new UserAdminService(users, sessions, encoder,
            Clock.fixed(Instant.parse("2026-10-10T12:00:00Z"), ZoneOffset.UTC));

    private User user(String id, Role role, boolean active) {
        User user = new User();
        user.setId(id);
        user.setName("Usuario " + id);
        user.setEmail(id + "@uni.edu");
        user.setRole(role);
        user.setActive(active);
        return user;
    }

    @Test
    void regularUsersCannotListUsers() {
        assertThrows(ForbiddenException.class, () -> service.list(user("u1", Role.USER, true)));
    }

    @Test
    void legacyUsersWithoutRoleAreRegularAndActive() {
        User legacy = new User();
        assertEquals(Role.USER, legacy.getRole());
        assertTrue(legacy.isActive());
    }

    @Test
    void adminCreatesUserWithHashedPasswordAndDefaultRole() {
        when(users.findByEmailIgnoreCase("nuevo@uni.edu")).thenReturn(Optional.empty());
        when(encoder.encode("12345678")).thenReturn("hash");
        when(users.save(any(User.class))).then(returnsFirstArg());

        AdminUserResponse created = service.create(user("a1", Role.ADMIN, true),
                new CreateUserRequest(" Nuevo ", "Nuevo@Uni.edu", "12345678", null));

        assertEquals("Nuevo", created.name());
        assertEquals("nuevo@uni.edu", created.email());
        assertEquals(Role.USER, created.role());
        assertTrue(created.active());
    }

    @Test
    void createRejectsShortPasswordAndDuplicatedEmail() {
        User admin = user("a1", Role.ADMIN, true);
        assertThrows(BusinessRuleException.class,
                () -> service.create(admin, new CreateUserRequest("N", "n@uni.edu", "corta", Role.USER)));

        when(users.findByEmailIgnoreCase("n@uni.edu")).thenReturn(Optional.of(user("u9", Role.USER, true)));
        assertThrows(BusinessRuleException.class,
                () -> service.create(admin, new CreateUserRequest("N", "n@uni.edu", "12345678", Role.USER)));
    }

    @Test
    void deactivatingAUserClosesTheirSessions() {
        User admin = user("a1", Role.ADMIN, true);
        User target = user("u1", Role.USER, true);
        when(users.findById("u1")).thenReturn(Optional.of(target));
        when(users.save(any(User.class))).then(returnsFirstArg());

        AdminUserResponse updated = service.update(admin, "u1", new UpdateUserRequest(null, null, false));

        assertFalse(updated.active());
        verify(sessions).deleteByUserId("u1");
    }

    @Test
    void adminCannotDemoteOrDeactivateThemselves() {
        User admin = user("a1", Role.ADMIN, true);
        when(users.findById("a1")).thenReturn(Optional.of(admin));

        assertThrows(BusinessRuleException.class, () -> service.update(admin, "a1", new UpdateUserRequest(null, Role.USER, null)));
        assertThrows(BusinessRuleException.class, () -> service.update(admin, "a1", new UpdateUserRequest(null, null, false)));
        verify(users, never()).save(any(User.class));
    }

    @Test
    void lastActiveAdminCannotBeDemoted() {
        User actor = user("a1", Role.ADMIN, true);
        User other = user("a2", Role.ADMIN, true);
        when(users.findById("a2")).thenReturn(Optional.of(other));
        when(users.findAll()).thenReturn(List.of(other, user("u1", Role.USER, true)));

        assertThrows(BusinessRuleException.class, () -> service.update(actor, "a2", new UpdateUserRequest(null, Role.USER, null)));
    }

    @Test
    void adminCannotDeleteThemselvesOrTheLastAdmin() {
        User actor = user("a1", Role.ADMIN, true);
        User other = user("a2", Role.ADMIN, true);
        when(users.findById("a1")).thenReturn(Optional.of(actor));
        when(users.findById("a2")).thenReturn(Optional.of(other));
        when(users.findAll()).thenReturn(List.of(other));

        assertThrows(BusinessRuleException.class, () -> service.delete(actor, "a1"));
        assertThrows(BusinessRuleException.class, () -> service.delete(actor, "a2"));
        verify(users, never()).deleteById(any());
    }

    @Test
    void deleteRemovesUserAndSessions() {
        User admin = user("a1", Role.ADMIN, true);
        when(users.findById("u1")).thenReturn(Optional.of(user("u1", Role.USER, true)));

        service.delete(admin, "u1");

        verify(sessions).deleteByUserId("u1");
        verify(users).deleteById("u1");
    }
}
