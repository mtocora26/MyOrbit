package com.app.myorbit.academic.application;

import com.app.myorbit.academic.domain.ClassSlot;
import com.app.myorbit.academic.domain.Semester;
import com.app.myorbit.academic.domain.Subject;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.users.application.UserZoneService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Convierte el horario semanal de las materias en clases concretas por fecha, para la Agenda y para «estás en clase».
 * Una franja se repite cada semana solo mientras dura el semestre de su materia; sin fechas de semestre no se sabe
 * cuándo empieza ni termina, así que esa materia no genera clases.
 */
@Service
public class ClassAgendaService {
    /** Rango máximo de una consulta, para no expandir años de clases de una sola vez. */
    public static final int MAX_RANGE_DAYS = 62;
    /** Cuántos días hacia adelante se busca la próxima clase. */
    static final int LOOK_AHEAD_DAYS = 14;

    private final SubjectService subjectService;
    private final SemesterService semesterService;
    private final UserZoneService userZoneService;

    public ClassAgendaService(SubjectService subjectService, SemesterService semesterService, UserZoneService userZoneService) {
        this.subjectService = subjectService;
        this.semesterService = semesterService;
        this.userZoneService = userZoneService;
    }

    /** Una clase concreta: la franja de una materia en una fecha. */
    public record ClassOccurrence(Subject subject, ClassSlot slot, LocalDate date) {
        public LocalDateTime startsAt() { return date.atTime(slot.startTime()); }
        public LocalDateTime endsAt() { return date.atTime(slot.endTime()); }
    }

    /** La clase en curso (si la hay) y la siguiente que empieza después de ahora (si la hay en los próximos días). */
    public record ClassNow(ClassOccurrence current, ClassOccurrence next) {
    }

    /** Clases entre dos fechas (ambas incluidas), por fecha y hora de inicio. */
    public List<ClassOccurrence> between(String userId, LocalDate from, LocalDate to) {
        if (from == null || to == null) throw new BusinessRuleException("Indica el rango de fechas: from y to");
        if (from.isAfter(to)) throw new BusinessRuleException("El rango de fechas no es valido: from no puede ser posterior a to");
        if (ChronoUnit.DAYS.between(from, to) > MAX_RANGE_DAYS) throw new BusinessRuleException("El rango no puede superar " + MAX_RANGE_DAYS + " dias");
        return expand(userId, from, to);
    }

    /** Según la hora local del usuario (su zona, #130): en qué clase está y cuál es la siguiente. */
    public ClassNow now(String userId) {
        LocalDateTime now = userZoneService.now(userId);
        List<ClassOccurrence> upcoming = expand(userId, now.toLocalDate(), now.toLocalDate().plusDays(LOOK_AHEAD_DAYS));
        ClassOccurrence current = upcoming.stream()
                .filter(occurrence -> !occurrence.startsAt().isAfter(now) && occurrence.endsAt().isAfter(now))
                .findFirst().orElse(null);
        ClassOccurrence next = upcoming.stream()
                .filter(occurrence -> occurrence.startsAt().isAfter(now))
                .findFirst().orElse(null);
        return new ClassNow(current, next);
    }

    private List<ClassOccurrence> expand(String userId, LocalDate from, LocalDate to) {
        List<ClassOccurrence> occurrences = new ArrayList<>();
        for (Subject subject : subjectService.listByUser(userId)) {
            if (subject.getSchedule().isEmpty()) continue;
            Optional<Semester> semester = semesterService.find(userId, subject.getSemester()).filter(Semester::hasDates);
            if (semester.isEmpty()) continue;
            LocalDate first = from.isAfter(semester.get().getStartDate()) ? from : semester.get().getStartDate();
            LocalDate last = to.isBefore(semester.get().getEndDate()) ? to : semester.get().getEndDate();
            for (LocalDate day = first; !day.isAfter(last); day = day.plusDays(1)) {
                for (ClassSlot slot : subject.getSchedule()) {
                    if (slot.day() == day.getDayOfWeek()) occurrences.add(new ClassOccurrence(subject, slot, day));
                }
            }
        }
        occurrences.sort(Comparator.comparing(ClassOccurrence::date).thenComparing(occurrence -> occurrence.slot().startTime()));
        return occurrences;
    }
}
