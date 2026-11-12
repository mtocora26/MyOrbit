package com.app.myorbit.events.application;

import com.app.myorbit.academic.application.SubjectService;
import com.app.myorbit.academic.domain.Subject;
import com.app.myorbit.academic.domain.SubjectDeletedEvent;
import com.app.myorbit.categories.application.CategoryService;
import com.app.myorbit.categories.domain.Category;
import com.app.myorbit.categories.domain.CategoryDeletedEvent;
import com.app.myorbit.events.api.CalendarEventRequest;
import com.app.myorbit.events.domain.CalendarEvent;
import com.app.myorbit.events.infrastructure.CalendarEventRepository;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CalendarEventServiceTest {
    private static final LocalDate MON = LocalDate.of(2026, 3, 2);
    private static final LocalDate FRI = LocalDate.of(2026, 3, 6);

    private final CalendarEventRepository repository = mock(CalendarEventRepository.class);
    private final SubjectService subjects = mock(SubjectService.class);
    private final CategoryService categories = mock(CategoryService.class);
    private final CalendarEventService service = new CalendarEventService(repository, subjects, categories);

    @BeforeEach
    void setUp() {
        when(repository.save(any(CalendarEvent.class))).then(returnsFirstArg());
        when(subjects.getOwned("u1", "redes")).thenReturn(subject("redes"));
        when(subjects.getOwned("u1", "ajena")).thenThrow(new NotFoundException("Materia no encontrada"));
        when(categories.getOwned("u1", "uni")).thenReturn(category("uni"));
        when(categories.getOwned("u1", "ajena")).thenThrow(new NotFoundException("Categoría no encontrada"));
    }

    private Subject subject(String id) {
        Subject subject = new Subject();
        subject.setId(id);
        subject.setUserId("u1");
        subject.update("Redes", 3, "2026-1", "#2E90FA");
        return subject;
    }

    private Category category(String id) {
        Category category = new Category();
        category.setId(id);
        category.setUserId("u1");
        category.setName("Universidad");
        return category;
    }

    private CalendarEvent stored(String id, String userId, String title, LocalDate start, LocalDate end, String startTime) {
        CalendarEvent event = new CalendarEvent();
        event.setId(id);
        event.setUserId(userId);
        event.update(title, start, end, startTime, null);
        return event;
    }

    private CalendarEventRequest request(String title, LocalDate start, LocalDate end, String subjectId, String categoryId) {
        return new CalendarEventRequest(title, start, end, null, null, subjectId, categoryId);
    }

    // ---------- crear ----------

    @Test
    void createAssignsTheOwnerAndStoresTheRange() {
        CalendarEvent created = service.create("u1", new CalendarEventRequest("Semana de parciales", MON, FRI, "08:00", null, "redes", "uni"));

        assertEquals("u1", created.getUserId());
        assertEquals(MON, created.getStartDate());
        assertEquals(FRI, created.getEndDate());
        assertEquals("08:00", created.getStartTime());
        assertEquals("redes", created.getSubjectId());
        assertEquals("uni", created.getCategoryId());
    }

    @Test
    void createWithoutAssociationsLeavesThemEmpty() {
        CalendarEvent created = service.create("u1", request("Feria", MON, null, null, "  "));

        assertNull(created.getSubjectId());
        assertNull(created.getCategoryId());
        assertEquals(MON, created.getEndDate());
    }

    @Test
    void createRejectsAnInvalidRangeWithABusinessError() {
        assertThrows(BusinessRuleException.class, () -> service.create("u1", request("Parcial", FRI, MON, null, null)));
        assertThrows(BusinessRuleException.class, () -> service.create("u1", new CalendarEventRequest("Parcial", MON, null, null, "10:00", null, null)));
        verify(repository, never()).save(any());
    }

    @Test
    void aSubjectOrCategoryOfAnotherUserIsNotFoundAndNothingIsSaved() {
        assertThrows(NotFoundException.class, () -> service.create("u1", request("Parcial", MON, null, "ajena", null)));
        assertThrows(NotFoundException.class, () -> service.create("u1", request("Parcial", MON, null, null, "ajena")));
        verify(repository, never()).save(any());
    }

    // ---------- consultar ----------

    @Test
    void getOwnedHidesOtherUsersEvents() {
        when(repository.findById("e1")).thenReturn(Optional.of(stored("e1", "u2", "Ajeno", MON, null, null)));

        assertThrows(NotFoundException.class, () -> service.getOwned("u1", "e1"));
        assertThrows(NotFoundException.class, () -> service.getOwned("u1", "no-existe"));
    }

    @Test
    void listFiltersByOverlapAndOrdersAllDayFirst() {
        when(repository.findByUserId("u1")).thenReturn(List.of(
                stored("tarde", "u1", "Charla", MON, null, "15:00"),
                stored("semana", "u1", "Semana de parciales", MON, FRI, null),
                stored("lejano", "u1", "Otro mes", LocalDate.of(2026, 5, 1), null, null),
                stored("manana", "u1", "Conferencia", MON, null, "09:00")));

        List<CalendarEvent> week = service.list("u1", MON, FRI);

        assertEquals(List.of("semana", "manana", "tarde"), week.stream().map(CalendarEvent::getId).toList());
        assertEquals(4, service.list("u1", null, null).size());
        // Un evento de varios días aparece en cualquier semana que toque.
        assertEquals(List.of("semana"), service.list("u1", LocalDate.of(2026, 3, 5), LocalDate.of(2026, 3, 8)).stream().map(CalendarEvent::getId).toList());
    }

    @Test
    void listRejectsAnInvertedRange() {
        assertThrows(BusinessRuleException.class, () -> service.list("u1", FRI, MON));
    }

    // ---------- editar y eliminar ----------

    @Test
    void updateReplacesEverythingSoOmittingAnOptionalFieldRemovesIt() {
        CalendarEvent existing = stored("e1", "u1", "Parcial", MON, FRI, "08:00");
        existing.setSubjectId("redes");
        existing.setCategoryId("uni");
        when(repository.findById("e1")).thenReturn(Optional.of(existing));

        CalendarEvent updated = service.update("u1", "e1", request("Parcial 1", MON, null, null, null));

        assertEquals("Parcial 1", updated.getTitle());
        assertEquals(MON, updated.getEndDate());
        assertNull(updated.getStartTime());
        assertNull(updated.getSubjectId());
        assertNull(updated.getCategoryId());
    }

    @Test
    void aFailedUpdateLeavesTheEventUntouched() {
        CalendarEvent existing = stored("e1", "u1", "Parcial", MON, FRI, "08:00");
        existing.setSubjectId("redes");
        when(repository.findById("e1")).thenReturn(Optional.of(existing));

        assertThrows(NotFoundException.class, () -> service.update("u1", "e1", request("Nuevo", MON, null, "ajena", null)));
        assertThrows(BusinessRuleException.class, () -> service.update("u1", "e1", request("Nuevo", FRI, MON, null, null)));

        assertEquals("Parcial", existing.getTitle());
        assertEquals("redes", existing.getSubjectId());
        verify(repository, never()).save(any());
    }

    @Test
    void deleteRemovesOnlyOwnedEvents() {
        when(repository.findById("e1")).thenReturn(Optional.of(stored("e1", "u1", "Parcial", MON, null, null)));
        when(repository.findById("e2")).thenReturn(Optional.of(stored("e2", "u2", "Ajeno", MON, null, null)));

        service.delete("u1", "e1");
        assertThrows(NotFoundException.class, () -> service.delete("u1", "e2"));

        verify(repository).deleteById("e1");
        verify(repository, never()).deleteById("e2");
    }

    // ---------- limpieza al borrar materia o categoría ----------

    @Test
    void deletingASubjectUnlinksItsEventsButKeepsThem() {
        CalendarEvent first = stored("e1", "u1", "Parcial", MON, null, null);
        first.setSubjectId("redes");
        first.setCategoryId("uni");
        when(repository.findByUserIdAndSubjectId("u1", "redes")).thenReturn(List.of(first));

        service.onSubjectDeleted(new SubjectDeletedEvent("u1", "redes"));

        assertNull(first.getSubjectId());
        assertEquals("uni", first.getCategoryId());
        verify(repository).saveAll(List.of(first));
    }

    @Test
    void deletingACategoryUncategorizesItsEvents() {
        CalendarEvent first = stored("e1", "u1", "Parcial", MON, null, null);
        first.setCategoryId("uni");
        first.setSubjectId("redes");
        when(repository.findByUserIdAndCategoryId("u1", "uni")).thenReturn(List.of(first));

        service.onCategoryDeleted(new CategoryDeletedEvent("u1", "uni"));

        assertNull(first.getCategoryId());
        assertEquals("redes", first.getSubjectId());
        verify(repository).saveAll(List.of(first));
    }

    @Test
    void cleanupWithNothingAffectedSavesNothing() {
        when(repository.findByUserIdAndSubjectId("u1", "redes")).thenReturn(List.of());
        when(repository.findByUserIdAndCategoryId("u1", "uni")).thenReturn(List.of());

        service.onSubjectDeleted(new SubjectDeletedEvent("u1", "redes"));
        service.onCategoryDeleted(new CategoryDeletedEvent("u1", "uni"));

        verify(repository, never()).saveAll(anyIterable());
    }
}
