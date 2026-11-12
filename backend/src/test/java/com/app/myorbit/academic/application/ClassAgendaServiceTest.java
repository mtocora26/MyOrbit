package com.app.myorbit.academic.application;

import com.app.myorbit.academic.application.ClassAgendaService.ClassNow;
import com.app.myorbit.academic.application.ClassAgendaService.ClassOccurrence;
import com.app.myorbit.academic.domain.ClassSlot;
import com.app.myorbit.academic.domain.Semester;
import com.app.myorbit.academic.domain.Subject;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.users.application.UserZoneService;
import com.app.myorbit.users.domain.User;
import com.app.myorbit.users.infrastructure.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ClassAgendaServiceTest {
    // Semestre del lunes 2 de febrero al viernes 12 de junio de 2026.
    private static final LocalDate START = LocalDate.of(2026, 2, 2);
    private static final LocalDate END = LocalDate.of(2026, 6, 12);

    private final SubjectService subjects = mock(SubjectService.class);
    private final SemesterService semesters = mock(SemesterService.class);
    private final UserRepository users = mock(UserRepository.class);

    private Subject redes;
    private Subject calculo;

    @BeforeEach
    void setUp() {
        redes = subject("s1", "Redes", "2026-1", ClassSlot.of(1, "08:00", "10:00", "Aula 301"), ClassSlot.of(3, "14:00", "16:00", null));
        calculo = subject("s2", "Cálculo", "2026-1", ClassSlot.of(1, "10:00", "12:00", "Aula 105"));
        when(subjects.listByUser("u1")).thenReturn(List.of(redes, calculo));
        when(semesters.find("u1", "2026-1")).thenReturn(Optional.of(semester("2026-1", START, END)));
        user("America/Bogota");
    }

    private ClassAgendaService service(String instant) {
        return new ClassAgendaService(subjects, semesters, new UserZoneService(users, Clock.fixed(Instant.parse(instant), ZoneOffset.UTC)));
    }

    private void user(String zone) {
        User user = new User();
        user.setId("u1");
        user.setTimeZone(zone);
        when(users.findById("u1")).thenReturn(Optional.of(user));
    }

    private Subject subject(String id, String name, String semester, ClassSlot... slots) {
        Subject subject = new Subject();
        subject.setId(id);
        subject.setUserId("u1");
        subject.update(name, 3, semester, "#2E90FA", null, null, List.of(slots));
        return subject;
    }

    private Semester semester(String name, LocalDate start, LocalDate end) {
        Semester semester = new Semester();
        semester.setUserId("u1");
        semester.update(name, start, end);
        return semester;
    }

    private List<String> summary(List<ClassOccurrence> occurrences) {
        return occurrences.stream().map(o -> o.date() + " " + o.slot().getStart() + " " + o.subject().getName()).toList();
    }

    @Test
    void expandsTheWeeklySlotsIntoDatedClassesInOrder() {
        List<ClassOccurrence> week = service("2026-03-02T14:00:00Z").between("u1", LocalDate.of(2026, 3, 2), LocalDate.of(2026, 3, 8));

        assertEquals(List.of("2026-03-02 08:00 Redes", "2026-03-02 10:00 Cálculo", "2026-03-04 14:00 Redes"), summary(week));
        assertEquals(LocalDateTime.of(2026, 3, 2, 8, 0), week.get(0).startsAt());
        assertEquals(LocalDateTime.of(2026, 3, 2, 10, 0), week.get(0).endsAt());
    }

    @Test
    void rangeEndsAreIncluded() {
        List<ClassOccurrence> oneDay = service("2026-03-02T14:00:00Z").between("u1", LocalDate.of(2026, 3, 4), LocalDate.of(2026, 3, 4));

        assertEquals(List.of("2026-03-04 14:00 Redes"), summary(oneDay));
    }

    @Test
    void classesStopOutsideTheSemesterDates() {
        ClassAgendaService service = service("2026-03-02T14:00:00Z");

        // Antes del inicio: el lunes 26 de enero y el miércoles 28 no son clase.
        assertEquals(List.of("2026-02-02 08:00 Redes", "2026-02-02 10:00 Cálculo", "2026-02-04 14:00 Redes"),
                summary(service.between("u1", LocalDate.of(2026, 1, 25), LocalDate.of(2026, 2, 5))));
        // Después del fin (viernes 12 de junio): el miércoles 17 no es clase.
        assertEquals(List.of("2026-06-10 14:00 Redes"), summary(service.between("u1", LocalDate.of(2026, 6, 9), LocalDate.of(2026, 6, 20))));
        // Un rango entero fuera del semestre no tiene clases.
        assertTrue(service.between("u1", LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31)).isEmpty());
    }

    @Test
    void aSubjectWhoseSemesterHasNoDatesOrDoesNotExistGivesNoClasses() {
        when(semesters.find("u1", "2026-1")).thenReturn(Optional.of(semester("2026-1", null, null)));
        assertTrue(service("2026-03-02T14:00:00Z").between("u1", LocalDate.of(2026, 3, 2), LocalDate.of(2026, 3, 8)).isEmpty());

        when(semesters.find("u1", "2026-1")).thenReturn(Optional.empty());
        assertTrue(service("2026-03-02T14:00:00Z").between("u1", LocalDate.of(2026, 3, 2), LocalDate.of(2026, 3, 8)).isEmpty());

        when(semesters.find("u1", "2026-1")).thenReturn(Optional.of(semester("2026-1", START, null)));
        assertTrue(service("2026-03-02T14:00:00Z").between("u1", LocalDate.of(2026, 3, 2), LocalDate.of(2026, 3, 8)).isEmpty());
    }

    @Test
    void eachSubjectFollowsItsOwnSemester() {
        Subject old = subject("s3", "Física", "2025-2", ClassSlot.of(1, "07:00", "09:00", null));
        when(subjects.listByUser("u1")).thenReturn(List.of(redes, old));
        when(semesters.find("u1", "2025-2")).thenReturn(Optional.of(semester("2025-2", LocalDate.of(2025, 8, 4), LocalDate.of(2025, 12, 5))));

        assertEquals(List.of("2026-03-02 08:00 Redes", "2026-03-04 14:00 Redes"),
                summary(service("2026-03-02T14:00:00Z").between("u1", LocalDate.of(2026, 3, 2), LocalDate.of(2026, 3, 8))));
    }

    @Test
    void subjectsWithoutScheduleGiveNothing() {
        when(subjects.listByUser("u1")).thenReturn(List.of(subject("s4", "Ética", "2026-1")));

        assertTrue(service("2026-03-02T14:00:00Z").between("u1", LocalDate.of(2026, 3, 2), LocalDate.of(2026, 3, 8)).isEmpty());
    }

    @Test
    void invalidRangesAreRejected() {
        ClassAgendaService service = service("2026-03-02T14:00:00Z");
        LocalDate day = LocalDate.of(2026, 3, 2);

        assertThrows(BusinessRuleException.class, () -> service.between("u1", day.plusDays(1), day));
        assertThrows(BusinessRuleException.class, () -> service.between("u1", null, day));
        assertThrows(BusinessRuleException.class, () -> service.between("u1", day, null));
        assertThrows(BusinessRuleException.class, () -> service.between("u1", day, day.plusDays(ClassAgendaService.MAX_RANGE_DAYS + 1)));
        // El rango máximo exacto sí se acepta.
        assertDoesNotThrow(() -> service.between("u1", day, day.plusDays(ClassAgendaService.MAX_RANGE_DAYS)));
    }

    @Test
    void duringAClassItIsCurrentAndTheNextOneFollows() {
        // Lunes 2 de marzo, 09:00 en Bogotá (14:00 UTC): en Redes hasta las 10:00; después Cálculo.
        ClassNow now = service("2026-03-02T14:00:00Z").now("u1");

        assertEquals("Redes", now.current().subject().getName());
        assertEquals(LocalDateTime.of(2026, 3, 2, 10, 0), now.current().endsAt());
        assertEquals("Cálculo", now.next().subject().getName());
        assertEquals(LocalDateTime.of(2026, 3, 2, 10, 0), now.next().startsAt());
    }

    @Test
    void theEndOfAClassIsExclusiveAndTheNextOneStartsRightThere() {
        ClassNow now = service("2026-03-02T15:00:00Z").now("u1"); // 10:00 en Bogotá

        assertEquals("Cálculo", now.current().subject().getName());
        assertEquals("Redes", now.next().subject().getName());
        assertEquals(LocalDate.of(2026, 3, 4), now.next().date());
    }

    @Test
    void outsideAnyClassThereIsOnlyANextOne() {
        ClassNow now = service("2026-03-02T17:00:00Z").now("u1"); // 12:00 en Bogotá: libre

        assertNull(now.current());
        assertEquals("Redes", now.next().subject().getName());
        assertEquals(LocalDate.of(2026, 3, 4), now.next().date());
    }

    @Test
    void theUsersZoneDecidesWhatTimeItIs() {
        // El mismo instante (14:00 UTC): en Bogotá es lunes 09:00 (en clase); en Tokio es lunes 23:00 (libre, la próxima es el miércoles).
        user("Asia/Tokyo");
        ClassNow tokyo = service("2026-03-02T14:00:00Z").now("u1");

        assertNull(tokyo.current());
        assertEquals(LocalDate.of(2026, 3, 4), tokyo.next().date());
    }

    @Test
    void whenTheSemesterIsOverThereIsNothing() {
        ClassNow now = service("2026-06-20T14:00:00Z").now("u1");

        assertNull(now.current());
        assertNull(now.next());
    }

    @Test
    void theNextClassCanBeInTheNextWeek() {
        ClassNow now = service("2026-03-04T22:00:00Z").now("u1"); // miércoles 17:00 en Bogotá, ya terminó todo

        assertNull(now.current());
        assertNotNull(now.next());
        assertEquals(LocalDate.of(2026, 3, 9), now.next().date());
        assertEquals("08:00", now.next().slot().getStart());
    }

    @Test
    void userLookupIsPerUser() {
        when(subjects.listByUser(anyString())).thenReturn(List.of());
        assertNull(service("2026-03-02T14:00:00Z").now("u2").current());
    }
}
