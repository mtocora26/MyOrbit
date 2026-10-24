package com.app.myorbit.users.application;

import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.ForbiddenException;
import com.app.myorbit.shared.error.NotFoundException;
import com.app.myorbit.users.api.AdminUserResponse;
import com.app.myorbit.users.api.CreateUserRequest;
import com.app.myorbit.users.api.UpdateUserRequest;
import com.app.myorbit.users.domain.Role;
import com.app.myorbit.users.domain.User;
import com.app.myorbit.users.infrastructure.UserRepository;
import com.app.myorbit.users.infrastructure.UserSessionRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/** Gestion de cuentas por parte de administradores. Cada operacion exige que quien la pide sea admin. */
@Service
public class UserAdminService {
    private final UserRepository userRepository;
    private final UserSessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    public UserAdminService(UserRepository userRepository, UserSessionRepository sessionRepository,
                            PasswordEncoder passwordEncoder, Clock clock) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    public List<AdminUserResponse> list(User actor) {
        requireAdmin(actor);
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getName, String.CASE_INSENSITIVE_ORDER))
                .map(AdminUserResponse::from)
                .toList();
    }

    public AdminUserResponse create(User actor, CreateUserRequest request) {
        requireAdmin(actor);
        String name = required(request.name(), "El nombre es obligatorio");
        String email = required(request.email(), "El correo es obligatorio").toLowerCase(Locale.ROOT);
        if (!email.contains("@")) throw new BusinessRuleException("Ingresa un correo valido");
        String password = required(request.password(), "La contrasena es obligatoria");
        if (password.length() < 8) throw new BusinessRuleException("La contrasena debe tener al menos 8 caracteres");
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new BusinessRuleException("Ya existe una cuenta con ese correo");
        }

        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(request.role() == null ? Role.USER : request.role());
        user.setActive(true);
        user.setCreatedAt(Instant.now(clock));
        return AdminUserResponse.from(userRepository.save(user));
    }

    public AdminUserResponse update(User actor, String userId, UpdateUserRequest request) {
        requireAdmin(actor);
        User target = userRepository.findById(userId).orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        boolean demoting = request.role() != null && request.role() != Role.ADMIN && target.isAdmin();
        boolean deactivating = Boolean.FALSE.equals(request.active()) && target.isActive();
        if (actor.getId().equals(target.getId()) && (demoting || deactivating)) {
            throw new BusinessRuleException("No puedes quitarte el rol de admin ni desactivar tu propia cuenta");
        }
        if ((demoting || deactivating) && target.isAdmin() && target.isActive() && countActiveAdmins() <= 1) {
            throw new BusinessRuleException("Debe quedar al menos un administrador activo");
        }

        if (request.name() != null) target.setName(required(request.name(), "El nombre es obligatorio"));
        if (request.role() != null) target.setRole(request.role());
        if (request.active() != null) target.setActive(request.active());
        User saved = userRepository.save(target);
        if (!saved.isActive()) sessionRepository.deleteByUserId(saved.getId());
        return AdminUserResponse.from(saved);
    }

    public void delete(User actor, String userId) {
        requireAdmin(actor);
        User target = userRepository.findById(userId).orElseThrow(() -> new NotFoundException("Usuario no encontrado"));
        if (actor.getId().equals(target.getId())) {
            throw new BusinessRuleException("No puedes eliminar tu propia cuenta");
        }
        if (target.isAdmin() && target.isActive() && countActiveAdmins() <= 1) {
            throw new BusinessRuleException("Debe quedar al menos un administrador activo");
        }
        sessionRepository.deleteByUserId(target.getId());
        userRepository.deleteById(target.getId());
    }

    private void requireAdmin(User actor) {
        if (!actor.isAdmin()) throw new ForbiddenException("Necesitas permisos de administrador");
    }

    private long countActiveAdmins() {
        return userRepository.findAll().stream().filter(user -> user.isAdmin() && user.isActive()).count();
    }

    private String required(String value, String message) {
        if (value == null || value.isBlank()) throw new BusinessRuleException(message);
        return value.trim();
    }
}
