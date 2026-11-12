package com.app.myorbit.academic.api;

import com.app.myorbit.academic.domain.ClassSlot;

public record ClassSlotResponse(int dayOfWeek, String start, String end, String room) {
    public static ClassSlotResponse from(ClassSlot slot) {
        return new ClassSlotResponse(slot.getDayOfWeek(), slot.getStart(), slot.getEnd(), slot.getRoom());
    }
}
