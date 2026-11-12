package com.app.myorbit.events.api;

import com.app.myorbit.events.application.CalendarEventService;
import com.app.myorbit.users.api.CurrentUser;
import com.app.myorbit.users.domain.User;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/events")
public class CalendarEventController {
    private final CalendarEventService eventService;

    public CalendarEventController(CalendarEventService eventService) {
        this.eventService = eventService;
    }

    /** Eventos que ocupan al menos un día entre {@code from} y {@code to} (ambos opcionales, incluidos). */
    @GetMapping
    public List<CalendarEventResponse> list(@CurrentUser User user,
                                            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return eventService.list(user.getId(), from, to).stream().map(CalendarEventResponse::from).toList();
    }

    @GetMapping("/{id}")
    public CalendarEventResponse get(@PathVariable String id, @CurrentUser User user) {
        return CalendarEventResponse.from(eventService.getOwned(user.getId(), id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CalendarEventResponse create(@Valid @RequestBody CalendarEventRequest request, @CurrentUser User user) {
        return CalendarEventResponse.from(eventService.create(user.getId(), request));
    }

    @PutMapping("/{id}")
    public CalendarEventResponse update(@PathVariable String id, @Valid @RequestBody CalendarEventRequest request, @CurrentUser User user) {
        return CalendarEventResponse.from(eventService.update(user.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id, @CurrentUser User user) {
        eventService.delete(user.getId(), id);
    }
}
