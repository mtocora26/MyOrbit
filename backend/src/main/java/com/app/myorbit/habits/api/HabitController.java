package com.app.myorbit.habits.api;

import com.app.myorbit.habits.application.HabitService;
import com.app.myorbit.users.api.CurrentUser;
import com.app.myorbit.users.domain.User;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/habits")
public class HabitController {
    private final HabitService habitService;

    public HabitController(HabitService habitService) {
        this.habitService = habitService;
    }

    @GetMapping
    public List<HabitResponse> list(@CurrentUser User user) {
        return habitService.listByUser(user.getId()).stream().map(HabitResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HabitResponse create(@RequestBody CreateHabitRequest request, @CurrentUser User user) {
        return HabitResponse.from(habitService.create(user.getId(), request));
    }

    @PatchMapping("/{id}/completion")
    public HabitResponse updateCompletion(@PathVariable String id, @RequestBody UpdateHabitCompletionRequest request, @CurrentUser User user) {
        return HabitResponse.from(habitService.updateCompletion(user.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id, @CurrentUser User user) {
        habitService.delete(user.getId(), id);
    }
}
