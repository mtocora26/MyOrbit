package com.app.myorbit.habits.api;

import com.app.myorbit.habits.application.HabitService;
import com.app.myorbit.habits.domain.Habit;
import com.app.myorbit.users.application.AuthService;
import com.app.myorbit.users.domain.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/habits")
public class HabitController {
    private final HabitService habitService;
    private final AuthService authService;

    public HabitController(HabitService habitService, AuthService authService) {
        this.habitService = habitService;
        this.authService = authService;
    }

    @GetMapping
    public List<Habit> list(@RequestHeader("Authorization") String authorization) {
        return habitService.listByUser(authService.requireUser(authorization).getId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Habit create(@RequestBody CreateHabitRequest request, @RequestHeader("Authorization") String authorization) {
        return habitService.create(authService.requireUser(authorization).getId(), request);
    }

    @PatchMapping("/{id}/completion")
    public ResponseEntity<Habit> updateCompletion(@PathVariable String id, @RequestBody UpdateHabitCompletionRequest request, @RequestHeader("Authorization") String authorization) {
        if (!belongsToUser(habitService.findById(id), authorization)) return ResponseEntity.notFound().build();
        Habit habit = habitService.updateCompletion(id, request);
        return habit == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(habit);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, @RequestHeader("Authorization") String authorization) {
        if (!belongsToUser(habitService.findById(id), authorization)) return ResponseEntity.notFound().build();
        return habitService.delete(id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    private boolean belongsToUser(Habit habit, String authorization) {
        if (habit == null) return false;
        User user = authService.requireUser(authorization);
        return habit.getUserId().equals(user.getId());
    }
}