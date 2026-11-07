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
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
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
    private final Duration sessionTtl;

    public AuthService(UserRepository userRepository, UserSessionRepository sessionRepository,
                       PasswordEncoder passwordEncoder, Clock clock,
                       @Value("${myorbit.admin-emails:}") List<String> adminEmails,
                       @Value("${myorbit.session-ttl:30d}") Duration sessionTtl) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
        this.sessionTtl = sessionTtl;
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
        if (isExpired(session)) {
            // Mongo purga con retraso (~1 min), asi que la vigencia tambien se comprueba aqui.
            sessionRepository.delete(session);
            throw new UnauthorizedException("Tu sesion expiro, inicia sesion de nuevo");
        }
        User user = userRepository.findById(session.getUserId())
                .orElseThrow(() -> new UnauthorizedException("Sesion no valida"));
        requireActive(user);
        return user;
    }

    private boolean isExpired(UserSession session) {
        // Sesiones creadas antes del TTL no tienen fecha: se tratan como vencidas.
        return session.getExpiresAt() == null || !session.getExpiresAt().isAfter(Instant.now(clock));
    }

    private void requireActive(User user) {
        if (!user.isActive()) throw new UnauthorizedException("Tu cuenta esta desactivada");
    }

    public void logout(String authorization) {
        sessionRepository.deleteById(extractToken(authorization));
    }

    public User updateName(String userId, String newName) {
        String name = required(newName, "El nombre es obligatorio");
        if (name.length() > 100) {
            throw new BusinessRuleException("El nombre es demasiado largo");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new com.app.myorbit.shared.error.NotFoundException("Usuario no encontrado"));
        user.setName(name);
        return userRepository.save(user);
    }

    /** Solo se aceptan zonas con nombre de región (America/Bogota) o UTC; se guarda tal cual la define el sistema. */
    public User updateTimeZone(String userId, String timeZone) {
        String zone = required(timeZone, "La zona horaria es obligatoria");
        if (!ZoneId.getAvailableZoneIds().contains(zone) || zone.startsWith("Etc/") && !zone.equals("Etc/UTC")) {
            throw new BusinessRuleException("La zona horaria no es valida, usa un nombre como America/Bogota");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new com.app.myorbit.shared.error.NotFoundException("Usuario no encontrado"));
        user.setTimeZone(zone);
        return userRepository.save(user);
    }

    public void changePassword(String userId, String authorization, String currentPassword, String newPassword) {
        String password = required(newPassword, "La contrasena es obligatoria");
        if (password.length() < 8) {
            throw new BusinessRuleException("La contrasena debe tener al menos 8 caracteres");
        }
        if (currentPassword == null || currentPassword.isBlank()) {
            throw new BusinessRuleException("La contrasena actual es obligatoria");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new com.app.myorbit.shared.error.NotFoundException("Usuario no encontrado"));
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new UnauthorizedException("La contrasena actual es incorrecta");
        }
        user.setPasswordHash(passwordEncoder.encode(password));
        userRepository.save(user);
        // Conservar la sesión actual y cerrar las demás (defensa frente a sesiones robadas).
        String currentToken = extractToken(authorization);
        sessionRepository.findByUserId(userId).stream()
                .filter(session -> !session.getToken().equals(currentToken))
                .forEach(sessionRepository::delete);
    }

    private AuthResponse createSession(User user) {
        UserSession session = new UserSession();
        session.setToken(UUID.randomUUID().toString());
        session.setUserId(user.getId());
        session.setExpiresAt(Instant.now(clock).plus(sessionTtl));
        sessionRepository.save(session);
        return new AuthResponse(session.getToken(), user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getTimeZone());
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