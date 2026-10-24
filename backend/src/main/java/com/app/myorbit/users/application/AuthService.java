package com.app.myorbit.users.application;

import com.app.myorbit.users.api.AuthResponse;
import com.app.myorbit.users.api.LoginRequest;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.UnauthorizedException;
import com.app.myorbit.users.api.RegisterRequest;
import com.app.myorbit.users.domain.Role;
import com.app.myorbit.users.domain.User;
import com.app.myorbit.users.domain.UserSession;
import com.app.myorbit.users.infrastructure.UserRepository;
import com.app.myorbit.users.infrastructure.UserSessionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService implements CurrentUserProvider {
    private final UserRepository userRepository;
    private final UserSessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;
    private final List<String> adminEmails;

    public AuthService(UserRepository userRepository, UserSessionRepository sessionRepository,
                       PasswordEncoder passwordEncoder, Clock clock,
                       @Value("${myorbit.admin-emails:}") List<String> adminEmails) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
        this.adminEmails = adminEmails.stream().map(email -> email.trim().toLowerCase(Locale.ROOT)).toList();
    }

    public AuthResponse register(RegisterRequest request) {
        String name = required(request.name(), "El nombre es obligatorio");
        String email = normalizedEmail(request.email());
        String password = required(request.password(), "La contrasena es obligatoria");
        if (password.length() < 8) {
            throw new BusinessRuleException("La contrasena debe tener al menos 8 caracteres");
        }
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new BusinessRuleException("Ya existe una cuenta con ese correo");
        }

        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        // Las cuentas admin se arrancan por configuracion (myorbit.admin-emails); nadie se auto-promueve.
        user.setRole(adminEmails.contains(email) ? Role.ADMIN : Role.USER);
        user.setActive(true);
        user.setCreatedAt(Instant.now(clock));
        return createSession(userRepository.save(user));
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalizedEmail(request.email());
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UnauthorizedException("Correo o contrasena incorrectos"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Correo o contrasena incorrectos");
        }
        requireActive(user);
        return createSession(user);
    }

    @Override
    public User requireUser(String authorization) {
        String token = extractToken(authorization);
        UserSession session = sessionRepository.findById(token)
                .orElseThrow(() -> new UnauthorizedException("Sesion no valida"));
        User user = userRepository.findById(session.getUserId())
                .orElseThrow(() -> new UnauthorizedException("Sesion no valida"));
        requireActive(user);
        return user;
    }

    private void requireActive(User user) {
        if (!user.isActive()) throw new UnauthorizedException("Tu cuenta esta desactivada");
    }

    public void logout(String authorization) {
        sessionRepository.deleteById(extractToken(authorization));
    }

    private AuthResponse createSession(User user) {
        UserSession session = new UserSession();
        session.setToken(UUID.randomUUID().toString());
        session.setUserId(user.getId());
        sessionRepository.save(session);
        return new AuthResponse(session.getToken(), user.getId(), user.getName(), user.getEmail(), user.getRole());
    }

    private String required(String value, String message) {
        if (value == null || value.isBlank()) throw new BusinessRuleException(message);
        return value.trim();
    }

    private String normalizedEmail(String value) {
        String email = required(value, "El correo es obligatorio").toLowerCase(Locale.ROOT);
        if (!email.contains("@")) throw new BusinessRuleException("Ingresa un correo valido");
        return email;
    }

    private String extractToken(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new UnauthorizedException("Debes iniciar sesion");
        }
        return authorization.substring(7);
    }
}