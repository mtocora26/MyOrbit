package com.app.myorbit.notifications.application;

import com.app.myorbit.notifications.domain.NotificationRequest;
import com.app.myorbit.notifications.domain.NotificationType;
import com.app.myorbit.notifications.domain.PersonalReminder;
import com.app.myorbit.notifications.infrastructure.PersonalReminderRepository;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.NotFoundException;
import com.app.myorbit.users.application.UserZoneService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PersonalReminderServiceTest {
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 9, 8, 0);

    private final PersonalReminderRepository repository = mock(PersonalReminderRepository.class);
    private final NotificationService notifications = mock(NotificationService.class);
    private final UserZoneService userZone = mock(UserZoneService.class);
    private final PersonalReminderService service = new PersonalReminderService(repository, notifications, userZone);

    private PersonalReminder reminder(String id, String userId, LocalDateTime at) {
        PersonalReminder reminder = new PersonalReminder();
        reminder.setId(id);
        reminder.setUserId(userId);
        reminder.setText("Llamar al banco");
        reminder.setRemindAt(at);
        return reminder;
    }

    @Test
    void createsAFutureReminderWithTrimmedText() {
        when(userZone.now("u1")).thenReturn(NOW);
        when(repository.save(any(PersonalReminder.class))).then(returnsFirstArg());

        PersonalReminder saved = service.create("u1", "  Llamar al banco  ", NOW.plusHours(2));

        assertEquals("Llamar al banco", saved.getText());
        assertEquals("u1", saved.getUserId());
        assertEquals(NOW.plusHours(2), saved.getRemindAt());
        assertFalse(saved.isFired());
    }

    @Test
    void rejectsBlankTextPastTimeAndTooLongText() {
        when(userZone.now("u1")).thenReturn(NOW);

        assertThrows(BusinessRuleException.class, () -> service.create("u1", "   ", NOW.plusHours(1)));
        assertThrows(BusinessRuleException.class, () -> service.create("u1", "algo", NOW));
        assertThrows(BusinessRuleException.class, () -> service.create("u1", "algo", NOW.minusMinutes(1)));
        assertThrows(BusinessRuleException.class, () -> service.create("u1", "x".repeat(141), NOW.plusHours(1)));
        assertThrows(BusinessRuleException.class, () -> service.create("u1", "algo", null));
        verify(repository, never()).save(any());
    }

    @Test
    void listsOnlyThePendingOnesOfTheUser() {
        PersonalReminder pending = reminder("r1", "u1", NOW.plusHours(1));
        when(repository.findByUserIdAndFiredFalseOrderByRemindAtAsc("u1")).thenReturn(List.of(pending));

        assertEquals(List.of(pending), service.listPending("u1"));
    }

    @Test
    void deletesOnlyOwnReminders() {
        PersonalReminder mine = reminder("r1", "u1", NOW.plusHours(1));
        when(repository.findById("r1")).thenReturn(Optional.of(mine));

        service.delete("u1", "r1");

        verify(repository).delete(mine);
        assertThrows(NotFoundException.class, () -> service.delete("intruso", "r1"));
        assertThrows(NotFoundException.class, () -> service.delete("u1", "no-existe"));
    }

    @Test
    void firesDueRemindersToTheInboxOnceAndMarksThemSent() {
        PersonalReminder due = reminder("r1", "u1", NOW.minusMinutes(1));
        when(repository.findByUserIdAndFiredFalseAndRemindAtLessThanEqual("u1", NOW)).thenReturn(List.of(due));

        int processed = service.fireDue("u1", NOW);

        assertEquals(1, processed);
        assertTrue(due.isFired());
        verify(repository).save(due);
        ArgumentCaptor<NotificationRequest> sent = ArgumentCaptor.forClass(NotificationRequest.class);
        verify(notifications).notify(sent.capture());
        assertEquals(NotificationType.REMINDER, sent.getValue().type());
        assertEquals("u1", sent.getValue().userId());
        assertEquals("r1", sent.getValue().referenceId());
        assertEquals("Llamar al banco", sent.getValue().subject());
    }

    @Test
    void firesNothingWhenNoneIsDue() {
        when(repository.findByUserIdAndFiredFalseAndRemindAtLessThanEqual("u1", NOW)).thenReturn(List.of());

        assertEquals(0, service.fireDue("u1", NOW));
        verify(notifications, never()).notify(any());
    }
}
