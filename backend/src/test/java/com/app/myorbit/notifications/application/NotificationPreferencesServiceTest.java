package com.app.myorbit.notifications.application;

import com.app.myorbit.notifications.domain.NotificationPreferences;
import com.app.myorbit.notifications.domain.NotificationType;
import com.app.myorbit.notifications.infrastructure.NotificationPreferencesRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class NotificationPreferencesServiceTest {
    private final NotificationPreferencesRepository repository = mock(NotificationPreferencesRepository.class);
    private final NotificationPreferencesService service = new NotificationPreferencesService(repository);

    @Test
    void aUserWhoNeverChosenHasEverythingEnabled() {
        when(repository.findById("u1")).thenReturn(Optional.empty());

        for (NotificationType type : NotificationType.values()) {
            assertTrue(service.isEnabled("u1", type), type.name());
        }
        assertTrue(service.get("u1").isDeadline() && service.get("u1").isEvent() && service.get("u1").isHabit());
    }

    @Test
    void updateSavesTheChoicesPerUser() {
        when(repository.findById("u1")).thenReturn(Optional.empty());
        when(repository.save(any(NotificationPreferences.class))).then(returnsFirstArg());

        NotificationPreferences saved = service.update("u1", true, false, true);

        assertFalse(saved.isEvent());
        assertTrue(saved.isDeadline() && saved.isHabit());
        verify(repository).save(saved);
    }

    @Test
    void isEnabledReadsTheSavedChoicePerType() {
        NotificationPreferences stored = NotificationPreferences.defaultsFor("u1");
        stored.update(false, true, false);
        when(repository.findById("u1")).thenReturn(Optional.of(stored));

        assertFalse(service.isEnabled("u1", NotificationType.DEADLINE));
        assertTrue(service.isEnabled("u1", NotificationType.EVENT));
        assertFalse(service.isEnabled("u1", NotificationType.HABIT));
    }
}
