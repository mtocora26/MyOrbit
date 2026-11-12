package com.app.myorbit.events.application;

import com.app.myorbit.academic.application.SubjectService;
import com.app.myorbit.academic.domain.SubjectDeletedEvent;
import com.app.myorbit.categories.application.CategoryService;
import com.app.myorbit.categories.domain.CategoryDeletedEvent;
import com.app.myorbit.events.api.CalendarEventRequest;
import com.app.myorbit.events.domain.CalendarEvent;
import com.app.myorbit.events.infrastructure.CalendarEventRepository;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.NotFoundException;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class CalendarEventService {
    private final CalendarEventRepository repository;
    private final SubjectService subjectService;
    private final CategoryService categoryService;

    public CalendarEventService(CalendarEventRepository repository, SubjectService subjectService, CategoryService categoryService) {
        this.repository = repository;
        this.subjectService = subjectService;
        this.categoryService = categoryService;
    }

    /**
     * Eventos del usuario que ocupan al menos un día dentro de [from, to] (extremos opcionales, incluidos), por fecha de
     * inicio y luego por hora (los que no tienen hora van primero, como «todo el día»).
     */
    public List<CalendarEvent> list(String userId, LocalDate from, LocalDate to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BusinessRuleException("El rango de fechas no es valido: from no puede ser posterior a to");
        }
        return repository.findByUserId(userId).stream()
                .filter(event -> event.overlaps(from, to))
                .sorted(Comparator.comparing(CalendarEvent::getStartDate)
                        .thenComparing(event -> event.getStartTime() == null ? "" : event.getStartTime())
                        .thenComparing(CalendarEvent::getTitle, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    public CalendarEvent getOwned(String userId, String id) {
        return repository.findById(id)
                .filter(event -> event.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("Evento no encontrado"));
    }

    public CalendarEvent create(String userId, CalendarEventRequest request) {
        CalendarEvent event = new CalendarEvent();
        event.setId(UUID.randomUUID().toString());
        event.setUserId(userId);
        apply(userId, event, request);
        return repository.save(event);
    }

    /** Reemplaza todos los datos del evento: un campo opcional ausente lo quita. */
    public CalendarEvent update(String userId, String id, CalendarEventRequest request) {
        CalendarEvent event = getOwned(userId, id);
        apply(userId, event, request);
        return repository.save(event);
    }

    public void delete(String userId, String id) {
        getOwned(userId, id);
        repository.deleteById(id);
    }

    /** Al borrar una materia, sus eventos se conservan pero dejan de estar asociados a ella. */
    @EventListener
    public void onSubjectDeleted(SubjectDeletedEvent event) {
        List<CalendarEvent> affected = repository.findByUserIdAndSubjectId(event.userId(), event.subjectId());
        affected.forEach(item -> item.setSubjectId(null));
        if (!affected.isEmpty()) repository.saveAll(affected);
    }

    /** Al borrar una categoría, sus eventos se conservan pero quedan sin categoría. */
    @EventListener
    public void onCategoryDeleted(CategoryDeletedEvent event) {
        List<CalendarEvent> affected = repository.findByUserIdAndCategoryId(event.userId(), event.categoryId());
        affected.forEach(item -> item.setCategoryId(null));
        if (!affected.isEmpty()) repository.saveAll(affected);
    }

    private void apply(String userId, CalendarEvent event, CalendarEventRequest request) {
        // La materia y la categoría se resuelven primero: si no son del usuario, 404 y no se toca el evento.
        String subjectId = blank(request.subjectId()) ? null : subjectService.getOwned(userId, request.subjectId().trim()).getId();
        String categoryId = blank(request.categoryId()) ? null : categoryService.getOwned(userId, request.categoryId().trim()).getId();
        try {
            event.update(request.title(), request.startDate(), request.endDate(), request.startTime(), request.endTime());
        } catch (IllegalArgumentException invalid) {
            throw new BusinessRuleException(invalid.getMessage());
        }
        event.setSubjectId(subjectId);
        event.setCategoryId(categoryId);
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
