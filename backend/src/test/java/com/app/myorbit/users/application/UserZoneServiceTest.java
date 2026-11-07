package com.app.myorbit.users.application;

import com.app.myorbit.users.application.UserZoneService.UserLocalTime;
import com.app.myorbit.users.domain.User;
import com.app.myorbit.users.infrastructure.UserRepository;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserZoneServiceTest {
    // 2026-11-08 03:30 UTC: ya es 8 de noviembre en Madrid y Tokio, pero aún 7 de noviembre en Bogotá.
    private static final Instant NOW = Instant.parse("2026-11-08T03:30:00Z");

    private final UserRepository repository = mock(UserRepository.class);
    private final UserZoneService service = new UserZoneService(repository, Clock.fixed(NOW, ZoneOffset.UTC));

    private User user(String id, String zone, boolean active) {
        User user = new User();
        user.setId(id);
        user.setTimeZone(zone);
        user.setActive(active);
        return user;
    }

    @Test
    void todayDependsOnTheUsersZone() {
        when(repository.findById("bogota")).thenReturn(Optional.of(user("bogota", "America/Bogota", true)));
        when(repository.findById("tokio")).thenReturn(Optional.of(user("tokio", "Asia/Tokyo", true)));

        assertEquals(LocalDate.of(2026, 11, 7), service.today("bogota"));
        assertEquals(LocalDate.of(2026, 11, 8), service.today("tokio"));
        assertEquals(LocalDateTime.of(2026, 11, 7, 22, 30), service.now("bogota"));
    }

    @Test
    void startOfTodayIsMidnightInTheUsersZone() {
        when(repository.findById("bogota")).thenReturn(Optional.of(user("bogota", "America/Bogota", true)));
        when(repository.findById("tokio")).thenReturn(Optional.of(user("tokio", "Asia/Tokyo", true)));

        assertEquals(Instant.parse("2026-11-07T05:00:00Z"), service.startOfToday("bogota"));
        assertEquals(Instant.parse("2026-11-07T15:00:00Z"), service.startOfToday("tokio"));
    }

    @Test
    void usersWithoutZoneOrUnknownUsersFallBackToColombia() {
        when(repository.findById("sin")).thenReturn(Optional.of(user("sin", null, true)));
        when(repository.findById("roto")).thenReturn(Optional.of(user("roto", "No/Existe", true)));
        when(repository.findById("fantasma")).thenReturn(Optional.empty());

        assertEquals(ZoneId.of("America/Bogota"), service.zoneOf("sin"));
        assertEquals(ZoneId.of("America/Bogota"), service.zoneOf("roto"));
        assertEquals(ZoneId.of("America/Bogota"), service.zoneOf("fantasma"));
    }

    @Test
    void listsOnlyActiveUsersWithTheirLocalTime() {
        when(repository.findAll()).thenReturn(List.of(
                user("a", "America/Bogota", true), user("b", "Asia/Tokyo", true), user("c", "Europe/Madrid", false)));

        List<UserLocalTime> users = service.activeUsersLocalTime();

        assertEquals(List.of("a", "b"), users.stream().map(UserLocalTime::userId).toList());
        assertEquals(22, users.get(0).now().getHour());
        assertEquals(12, users.get(1).now().getHour());
        assertTrue(users.stream().allMatch(u -> u.now().toInstant().equals(NOW)));
    }
}
