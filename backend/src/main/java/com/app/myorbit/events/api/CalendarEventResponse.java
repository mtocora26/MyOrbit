package com.app.myorbit.events.api;

import com.app.myorbit.events.domain.CalendarEvent;

import java.time.LocalDate;

/** {@code multiDay}: dura más de un día. {@code startTime}/{@code endTime}: null si el evento no tiene hora. */
public record CalendarEventResponse(String id, String title, LocalDate startDate, LocalDate endDate, String startTime, String endTime,
                                    String subjectId, String categoryId, boolean multiDay) {
    public static CalendarEventResponse from(CalendarEvent event) {
        return new CalendarEventResponse(event.getId(), event.getTitle(), event.getStartDate(), event.getEndDate(), event.getStartTime(),
                event.getEndTime(), event.getSubjectId(), event.getCategoryId(), event.isMultiDay());
    }
}
