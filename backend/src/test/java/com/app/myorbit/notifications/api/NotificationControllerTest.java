package com.app.myorbit.notifications.api;

import com.app.myorbit.notifications.application.NotificationPreferencesService;
import com.app.myorbit.notifications.application.NotificationService;
import com.app.myorbit.notifications.domain.NotificationPreferences;
import org.springframework.http.MediaType;
import com.app.myorbit.notifications.domain.Notification;
import com.app.myorbit.notifications.domain.NotificationType;
import com.app.myorbit.shared.error.NotFoundException;
import com.app.myorbit.shared.error.UnauthorizedException;
import com.app.myorbit.users.application.CurrentUserProvider;
import com.app.myorbit.users.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NotificationController.class)
class NotificationControllerTest {
    private static final String AUTH = "Bearer token-u1";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private NotificationService notificationService;

    @MockitoBean
    private NotificationPreferencesService preferencesService;

    @MockitoBean
    private CurrentUserProvider currentUserProvider;

    @BeforeEach
    void authenticate() {
        User user = new User();
        user.setId("u1");
        when(currentUserProvider.requireUser(AUTH)).thenReturn(user);
        when(currentUserProvider.requireUser(null)).thenThrow(new UnauthorizedException("Sesion invalida"));
    }

    private Notification notification(boolean read) {
        Notification n = new Notification();
        n.setId("n1");
        n.setUserId("u1");
        n.setType(NotificationType.DEADLINE);
        n.setTitle("Fecha límite");
        n.setMessage("La tarea vence pronto");
        n.setReferenceId("t1");
        n.setCreatedAt(Instant.parse("2026-11-07T12:00:00Z"));
        n.setRead(read);
        return n;
    }

    @Test
    void listReturnsNotificationsWithoutExposingTheUser() throws Exception {
        when(notificationService.listByUser("u1", false)).thenReturn(List.of(notification(false)));

        mockMvc.perform(get("/api/notifications").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("n1"))
                .andExpect(jsonPath("$[0].type").value("DEADLINE"))
                .andExpect(jsonPath("$[0].referenceId").value("t1"))
                .andExpect(jsonPath("$[0].read").value(false))
                .andExpect(jsonPath("$[0].createdAt").value("2026-11-07T12:00:00Z"))
                .andExpect(jsonPath("$[0].userId").doesNotExist());
    }

    @Test
    void listCanFilterUnread() throws Exception {
        when(notificationService.listByUser("u1", true)).thenReturn(List.of());

        mockMvc.perform(get("/api/notifications?unread=true").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void unreadCountReturnsTheCounter() throws Exception {
        when(notificationService.countUnread("u1")).thenReturn(4L);

        mockMvc.perform(get("/api/notifications/unread-count").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(4));
    }

    @Test
    void markAsReadReturnsTheUpdatedNotification() throws Exception {
        when(notificationService.markAsRead("u1", "n1")).thenReturn(notification(true));

        mockMvc.perform(patch("/api/notifications/n1/read").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.read").value(true));
    }

    @Test
    void markAsReadOfMissingNotificationIsNotFound() throws Exception {
        when(notificationService.markAsRead("u1", "x")).thenThrow(new NotFoundException("Notificación no encontrada"));

        mockMvc.perform(patch("/api/notifications/x/read").header("Authorization", AUTH))
                .andExpect(status().isNotFound());
    }

    @Test
    void markAllAsReadReportsHowManyWereUpdated() throws Exception {
        when(notificationService.markAllAsRead("u1")).thenReturn(2);

        mockMvc.perform(patch("/api/notifications/read-all").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.updated").value(2));
    }

    @Test
    void requestsWithoutSessionAreUnauthorized() throws Exception {
        mockMvc.perform(get("/api/notifications")).andExpect(status().isUnauthorized());
        mockMvc.perform(patch("/api/notifications/read-all")).andExpect(status().isUnauthorized());
    }

    private NotificationPreferences preferences(boolean deadline, boolean event, boolean habit) {
        NotificationPreferences preferences = NotificationPreferences.defaultsFor("u1");
        preferences.update(deadline, event, habit);
        return preferences;
    }

    @Test
    void preferencesReturnTheCurrentChoices() throws Exception {
        when(preferencesService.get("u1")).thenReturn(preferences(true, false, true));

        mockMvc.perform(get("/api/notifications/preferences").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deadline").value(true))
                .andExpect(jsonPath("$.event").value(false))
                .andExpect(jsonPath("$.habit").value(true));
    }

    @Test
    void updatePreferencesSavesAndReturnsThem() throws Exception {
        when(preferencesService.update("u1", false, true, false)).thenReturn(preferences(false, true, false));

        mockMvc.perform(put("/api/notifications/preferences").header("Authorization", AUTH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"deadline\":false,\"event\":true,\"habit\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deadline").value(false))
                .andExpect(jsonPath("$.habit").value(false));
        verify(preferencesService).update("u1", false, true, false);
    }

    @Test
    void updatePreferencesRejectsMissingFields() throws Exception {
        mockMvc.perform(put("/api/notifications/preferences").header("Authorization", AUTH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"deadline\":false}"))
                .andExpect(status().isBadRequest());
        verify(preferencesService, never()).update(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyBoolean(), org.mockito.ArgumentMatchers.anyBoolean(), org.mockito.ArgumentMatchers.anyBoolean());
    }

    @Test
    void preferencesRequireASession() throws Exception {
        mockMvc.perform(get("/api/notifications/preferences")).andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/notifications/preferences").contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isUnauthorized());
    }
}
