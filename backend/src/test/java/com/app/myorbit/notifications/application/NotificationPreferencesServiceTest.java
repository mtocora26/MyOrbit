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
        assertTrue(service.get("u1").isDeadline() && service.get("u1").isHabit() && service.get("u1").isOverdue()
                && service.get("u1").isExam() && service.get("u1").isAtRisk());
    }

    @Test
    void updateSavesTheChoicesPerUser() {
        when(repository.findById("u1")).thenReturn(Optional.empty());
        when(repository.save(any(NotificationPreferences.class))).then(returnsFirstArg());

        NotificationPreferences saved = service.update("u1", true, true, false, true, false);

        assertFalse(saved.isOverdue());
        assertFalse(saved.isAtRisk());
        assertTrue(saved.isDeadline() && saved.isHabit() && saved.isExam());
        verify(repository).save(saved);
    }

    @Test
    void isEnabledReadsTheSavedChoicePerType() {
        NotificationPreferences stored = NotificationPreferences.defaultsFor("u1");
        stored.update(false, true, false, true, false);
        when(repository.findById("u1")).thenReturn(Optional.of(stored));

        assertFalse(service.isEnabled("u1", NotificationType.DEADLINE));
        assertTrue(service.isEnabled("u1", NotificationType.HABIT));
        assertFalse(service.isEnabled("u1", NotificationType.OVERDUE));
        assertTrue(service.isEnabled("u1", NotificationType.EXAM));
        assertFalse(service.isEnabled("u1", NotificationType.AT_RISK));
    }
}
