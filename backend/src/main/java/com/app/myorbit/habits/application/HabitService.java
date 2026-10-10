package com.app.myorbit.habits.application;

import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.NotFoundException;
import com.app.myorbit.habits.api.CreateHabitRequest;
import com.app.myorbit.habits.api.UpdateHabitCompletionRequest;
import com.app.myorbit.habits.domain.Habit;
import com.app.myorbit.habits.infrastructure.HabitRepository;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class HabitService {
    private final HabitRepository habitRepository;

    public HabitService(HabitRepository habitRepository) {
        this.habitRepository = habitRepository;
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
        habit.setFrequency("personalizada".equals(request.frequency()) ? "personalizada" : "diaria");
        habit.setDaysOfWeek(normalizeDays(request.daysOfWeek(), habit.getFrequency()));
        habit.setColor(request.color() == null || request.color().isBlank() ? "#7A5AF8" : request.color());
        habit.setIcon(request.icon() == null || request.icon().isBlank() ? "target" : request.icon());
        return habitRepository.save(habit);
    }

    public Habit updateCompletion(String userId, String id, UpdateHabitCompletionRequest request) {
        Habit habit = getOwned(userId, id);
        String date = request.date() == null || request.date().isBlank() ? LocalDate.now().toString() : request.date();
        if (request.completed() && !habit.getCompletedDates().contains(date)) habit.getCompletedDates().add(date);
        if (!request.completed()) habit.getCompletedDates().remove(date);
        return habitRepository.save(habit);
    }

    public boolean delete(String userId, String id) {
        getOwned(userId, id);
        habitRepository.deleteById(id);
        return true;
    }

    private List<Integer> normalizeDays(List<Integer> days, String frequency) {
        if (!"personalizada".equals(frequency)) return List.of(1, 2, 3, 4, 5, 6, 7);
        List<Integer> validDays = days == null ? List.of() : days.stream().filter(day -> day >= 1 && day <= 7).distinct().toList();
        return validDays.isEmpty() ? List.of(1, 2, 3, 4, 5, 6, 7) : validDays;
    }
}