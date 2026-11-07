package com.app.myorbit.habits.application;

import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.NotFoundException;
import com.app.myorbit.habits.api.CreateHabitRequest;
import com.app.myorbit.habits.api.UpdateHabitCompletionRequest;
import com.app.myorbit.habits.api.UpdateHabitRequest;
import com.app.myorbit.habits.domain.Habit;
import com.app.myorbit.habits.domain.HabitFrequency;
import com.app.myorbit.habits.domain.HabitPendingEvent;
import com.app.myorbit.habits.infrastructure.HabitRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;

@Service
public class HabitService {
    private final HabitRepository habitRepository;
    private final Clock clock;
    private final ApplicationEventPublisher events;

    public HabitService(HabitRepository habitRepository, Clock clock, ApplicationEventPublisher events) {
        this.habitRepository = habitRepository;
        this.clock = clock;
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
        habit.setTitle(request.title().trim());
        habit.setFrequency(request.frequency() == null ? HabitFrequency.DAILY : request.frequency());
        habit.setDaysOfWeek(normalizeDays(request.daysOfWeek(), habit.getFrequency()));
        habit.setColor(request.color() == null || request.color().isBlank() ? "#7A5AF8" : request.color());
        habit.setIcon(request.icon() == null || request.icon().isBlank() ? "target" : request.icon());
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
        return habitRepository.save(habit);
    }

    public Habit updateCompletion(String userId, String id, UpdateHabitCompletionRequest request) {
        Habit habit = getOwned(userId, id);
        String date = resolveDate(request.date());
        if (request.completed() && !habit.getCompletedDates().contains(date)) habit.getCompletedDates().add(date);
        if (!request.completed()) habit.getCompletedDates().remove(date);
        return habitRepository.save(habit);
    }

    /** Sin fecha usa hoy; con fecha exige formato ISO (AAAA-MM-DD) y que exista en el calendario. */
    private String resolveDate(String raw) {
        if (raw == null || raw.isBlank()) return LocalDate.now(clock).toString();
        try {
            return LocalDate.parse(raw).toString();
        } catch (DateTimeParseException e) {
            throw new BusinessRuleException("La fecha debe tener el formato AAAA-MM-DD, por ejemplo 2026-10-10");
        }
    }

    /**
     * Publica un {@link HabitPendingEvent} por cada hábito programado para {@code date} que aún no está
     * cumplido ese día. Lo invoca el recordatorio programado (M4-04); aquí solo se detecta y se notifica.
     *
     * @return cantidad de hábitos pendientes notificados
     */
    public int publishPendingHabits(LocalDate date) {
        String key = date.toString();
        int pending = 0;
        for (Habit habit : habitRepository.findAll()) {
            if (!isScheduledOn(habit, date) || habit.getCompletedDates().contains(key)) continue;
            events.publishEvent(new HabitPendingEvent(habit.getUserId(), habit.getId(), habit.getTitle(), date));
            pending++;
        }
        return pending;
    }

    private boolean isScheduledOn(Habit habit, LocalDate date) {
        return habit.getFrequency() != HabitFrequency.CUSTOM
                || habit.getDaysOfWeek().contains(date.getDayOfWeek().getValue());
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