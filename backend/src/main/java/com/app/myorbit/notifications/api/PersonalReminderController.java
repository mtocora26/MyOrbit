package com.app.myorbit.notifications.api;

import com.app.myorbit.notifications.application.PersonalReminderService;
import com.app.myorbit.users.api.CurrentUser;
import com.app.myorbit.users.domain.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reminders")
public class PersonalReminderController {
    private final PersonalReminderService service;

    public PersonalReminderController(PersonalReminderService service) {
        this.service = service;
    }

    /** Los recordatorios pendientes (aún no enviados), el más próximo primero. */
    @GetMapping
    public List<PersonalReminderResponse> list(@CurrentUser User user) {
        return service.listPending(user.getId()).stream().map(PersonalReminderResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PersonalReminderResponse create(@Valid @RequestBody PersonalReminderRequest request, @CurrentUser User user) {
        return PersonalReminderResponse.from(service.create(user.getId(), request.text(), request.remindAt()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id, @CurrentUser User user) {
        service.delete(user.getId(), id);
    }
}
