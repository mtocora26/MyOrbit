package com.app.myorbit.notifications.api;

import com.app.myorbit.notifications.application.NotificationPreferencesService;
import com.app.myorbit.notifications.application.NotificationService;
import com.app.myorbit.users.api.CurrentUser;
import com.app.myorbit.users.domain.User;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notificationService;
    private final NotificationPreferencesService preferencesService;

    public NotificationController(NotificationService notificationService, NotificationPreferencesService preferencesService) {
        this.notificationService = notificationService;
        this.preferencesService = preferencesService;
    }

    @GetMapping
    public List<NotificationResponse> list(@CurrentUser User user,
                                           @RequestParam(required = false, defaultValue = "false") boolean unread) {
        return notificationService.listByUser(user.getId(), unread).stream().map(NotificationResponse::from).toList();
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(@CurrentUser User user) {
        return Map.of("count", notificationService.countUnread(user.getId()));
    }

    @GetMapping("/preferences")
    public NotificationPreferencesResponse preferences(@CurrentUser User user) {
        return NotificationPreferencesResponse.from(preferencesService.get(user.getId()));
    }

    @PutMapping("/preferences")
    public NotificationPreferencesResponse updatePreferences(@CurrentUser User user, @Valid @RequestBody NotificationPreferencesRequest request) {
        return NotificationPreferencesResponse.from(
                preferencesService.update(user.getId(), request.deadline(), request.event(), request.habit()));
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse markAsRead(@PathVariable String id, @CurrentUser User user) {
        return NotificationResponse.from(notificationService.markAsRead(user.getId(), id));
    }

    @PatchMapping("/read-all")
    public Map<String, Integer> markAllAsRead(@CurrentUser User user) {
        return Map.of("updated", notificationService.markAllAsRead(user.getId()));
    }
}
