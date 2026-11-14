package com.app.myorbit.habits.application;

import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.NotFoundException;
import com.app.myorbit.habits.api.CreateHabitRequest;
import com.app.myorbit.habits.api.UpdateHabitCompletionRequest;
import com.app.myorbit.habits.api.UpdateHabitRequest;
import com.app.myorbit.habits.domain.Habit;
import com.app.myorbit.habits.domain.HabitFrequency;
import com.app.myorbit.habits.domain.HabitPendingEvent;
import com.app.myorbit.habits.domain.HabitStats;
import com.app.myorbit.habits.domain.HabitType;
import com.app.myorbit.habits.domain.MonthlyProgress;
import com.app.myorbit.habits.infrastructure.HabitRepository;
import com.app.myorbit.users.application.UserZoneService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;

@Service
public class HabitService {
    private final HabitRepository habitRepository;
    private final UserZoneService userZone;
    private final ApplicationEventPublisher events;

    public HabitService(HabitRepository habitRepository, UserZoneService userZone, ApplicationEventPublisher events) {
        this.habitRepository = habitRepository;
        this.userZone = userZone;
        this.events = events;
    }

    public List<Habit> listByUser(String userId) {
        return habitRepository.findByUserIdOrderByTitleAsc(userId);
    }

    public Habit getOwned(String userId, String id) {
        return habitRepository.findById(id)
                .filter(habit -> habit.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("Habito no encontrado"));
    }

    public Habit create(String userId, CreateHabitRequest request) {
        if (request.title() == null || request.title().isBlank()) throw new BusinessRuleException("El nombre del habito es obligatorio");
        Habit habit = new Habit();
        habit.setId(UUID.randomUUID().toString());
        habit.setUserId(userId);
        habit.setCreatedDate(userZone.today(userId).toString());
        habit.setTitle(request.title().trim());
        habit.setFrequency(request.frequency() == null ? HabitFrequency.DAILY : request.frequency());
        habit.setDaysOfWeek(normalizeDays(request.daysOfWeek(), habit.getFrequency()));
        habit.setColor(request.color() == null || request.color().isBlank() ? "#7A5AF8" : request.color());
        habit.setIcon(request.icon() == null || request.icon().isBlank() ? "target" : request.icon());
        habit.setMonthlyGoal(request.monthlyGoal());
        habit.setType(request.type() == null ? HabitType.BUILD : request.type());
        return habitRepository.save(habit);
    }

    /** Edita los datos del hábito; el historial de fechas cumplidas no se toca. */
    public Habit update(String userId, String id, UpdateHabitRequest request) {
        Habit habit = getOwned(userId, id);
        if (request.title() == null || request.title().isBlank()) throw new BusinessRuleException("El nombre del habito es obligatorio");
        habit.setTitle(request.title().trim());
        if (request.frequency() != null) habit.setFrequency(request.frequency());
        List<Integer> days = request.daysOfWeek() != null ? request.daysOfWeek()
                : habit.getFrequency() == HabitFrequency.CUSTOM ? habit.getDaysOfWeek() : null;
        habit.setDaysOfWeek(normalizeDays(days, habit.getFrequency()));
        if (request.color() != null && !request.color().isBlank()) habit.setColor(request.color());
        if (request.icon() != null && !request.icon().isBlank()) habit.setIcon(request.icon());
        if (request.type() != null) habit.setType(request.type());
        if (request.monthlyGoal() != null) habit.setMonthlyGoal(request.monthlyGoal() == 0 ? null : request.monthlyGoal());
        return habitRepository.save(habit);
    }

    public Habit updateCompletion(String userId, String id, UpdateHabitCompletionRequest request) {
        Habit habit = getOwned(userId, id);
        String date = resolveDate(userId, request.date());
        if (request.completed() && !habit.getCompletedDates().contains(date)) habit.getCompletedDates().add(date);
        if (!request.completed()) habit.getCompletedDates().remove(date);
        return habitRepository.save(habit);
    }

    /** Sin fecha usa hoy; con fecha exige formato ISO (AAAA-MM-DD) y que exista en el calendario. */
    private String resolveDate(String userId, String raw) {
        if (raw == null || raw.isBlank()) return userZone.today(userId).toString();
        try {
            return LocalDate.parse(raw).toString();
        } catch (DateTimeParseException e) {
            throw new BusinessRuleException("La fecha debe tener el formato AAAA-MM-DD, por ejemplo 2026-10-10");
        }
    }

    /**
     * Publica un {@link HabitPendingEvent} por cada hábito del usuario programado para {@code date} que aún no
     * está cumplido ese día ({@code date} es "hoy" en la zona horaria del usuario). Lo invoca el recordatorio
     * programado; aquí solo se detecta y se notifica.
     *
     * @return cantidad de hábitos pendientes notificados
     */
    public int publishPendingHabits(String userId, LocalDate date) {
        String key = date.toString();
        int pending = 0;
        for (Habit habit : habitRepository.findByUserIdOrderByTitleAsc(userId)) {
            if (!habit.isScheduledOn(date) || habit.getCompletedDates().contains(key)) continue;
            events.publishEvent(new HabitPendingEvent(habit.getUserId(), habit.getId(), habit.getTitle(), date, habit.isQuit()));
            pending++;
        }
        return pending;
    }

    public static final int MAX_STATS_DAYS = 365;

    /** Racha actual, mejor racha y % de cumplimiento de los últimos {@code days} días (1-365). */
    public HabitStats stats(String userId, String id, int days) {
        if (days < 1 || days > MAX_STATS_DAYS) {
            throw new BusinessRuleException("El parametro days debe estar entre 1 y " + MAX_STATS_DAYS);
        }
        return HabitStats.calculate(getOwned(userId, id), userZone.today(userId), days);
    }

    public static final int MAX_HISTORY_MONTHS = 24;

    /** Cumplimiento del mes en curso frente a la meta del hábito, más los meses anteriores (hasta {@code months}). */
    public MonthlyGoalReport monthlyGoal(String userId, String id, int months) {
        if (months < 0 || months > MAX_HISTORY_MONTHS) {
            throw new BusinessRuleException("El parametro months debe estar entre 0 y " + MAX_HISTORY_MONTHS);
        }
        Habit habit = getOwned(userId, id);
        if (habit.getMonthlyGoal() == null) throw new BusinessRuleException("El habito no tiene una meta mensual");
        LocalDate today = userZone.today(userId);
        MonthlyProgress current = MonthlyProgress.calculate(habit, YearMonth.from(today), habit.getMonthlyGoal(), today);
        return new MonthlyGoalReport(habit.getMonthlyGoal(), current, MonthlyProgress.history(habit, habit.getMonthlyGoal(), today, months));
    }

    /** Meta mensual, avance del mes en curso e historial de meses ya terminados (más reciente primero). */
    public record MonthlyGoalReport(int goal, MonthlyProgress current, List<MonthlyProgress> history) {
    }

    public boolean delete(String userId, String id) {
        getOwned(userId, id);
        habitRepository.deleteById(id);
        return true;
    }

    private List<Integer> normalizeDays(List<Integer> days, HabitFrequency frequency) {
        if (frequency != HabitFrequency.CUSTOM) return List.of(1, 2, 3, 4, 5, 6, 7);
        List<Integer> validDays = days == null ? List.of() : days.stream().filter(day -> day >= 1 && day <= 7).distinct().toList();
        return validDays.isEmpty() ? List.of(1, 2, 3, 4, 5, 6, 7) : validDays;
    }
}