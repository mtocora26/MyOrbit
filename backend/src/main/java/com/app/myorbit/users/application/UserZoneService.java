package com.app.myorbit.users.application;

import com.app.myorbit.users.domain.User;
import com.app.myorbit.users.infrastructure.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

/**
 * Qué día y qué hora es para cada usuario. El servidor puede estar en cualquier zona (en la nube suele ser UTC);
 * "hoy", los horarios y los recordatorios se calculan con la zona que cada usuario eligió.
 */
@Service
public class UserZoneService {
    private final UserRepository userRepository;
    private final Clock clock;

    public UserZoneService(UserRepository userRepository, Clock clock) {
        this.userRepository = userRepository;
        this.clock = clock;
    }

    /** Un usuario activo con la hora local que es ahora mismo para él. */
    public record UserLocalTime(String userId, ZonedDateTime now) {
    }

    public ZoneId zoneOf(String userId) {
        return userRepository.findById(userId).map(User::zone).orElseGet(() -> ZoneId.of(User.DEFAULT_TIME_ZONE));
    }

    public LocalDate today(String userId) {
        return LocalDate.now(clock.withZone(zoneOf(userId)));
    }

    public LocalDateTime now(String userId) {
        return LocalDateTime.now(clock.withZone(zoneOf(userId)));
    }

    /** Instante en que empezó el día de hoy para el usuario. */
    public Instant startOfToday(String userId) {
        ZoneId zone = zoneOf(userId);
        return LocalDate.now(clock.withZone(zone)).atStartOfDay(zone).toInstant();
    }

    /** Usuarios activos con su hora local actual, para decidir a quién le toca un recordatorio. */
    public List<UserLocalTime> activeUsersLocalTime() {
        Instant instant = Instant.now(clock);
        return userRepository.findAll().stream()
                .filter(User::isActive)
                .map(user -> new UserLocalTime(user.getId(), instant.atZone(user.zone())))
                .toList();
    }
}
