package com.app.myorbit.habits.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "habits")
public class Habit {
    @Id
    private String id;
    private String userId;
    private String title;
    private HabitFrequency frequency;
    private List<Integer> daysOfWeek = new ArrayList<>();
    private String color;
    private String icon;
    private List<String> completedDates = new ArrayList<>();
    /** Día de creación (AAAA-MM-DD); null en hábitos anteriores a las estadísticas. */
    private String createdDate;

    public String getCreatedDate() { return createdDate; }
    public void setCreatedDate(String createdDate) { this.createdDate = createdDate; }

    /** Los hábitos diarios se programan todos los días; los personalizados, en sus {@code daysOfWeek} (1 = lunes … 7 = domingo). */
    public boolean isScheduledOn(LocalDate date) {
        return frequency != HabitFrequency.CUSTOM || daysOfWeek.contains(date.getDayOfWeek().getValue());
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public HabitFrequency getFrequency() { return frequency; }
    public void setFrequency(HabitFrequency frequency) { this.frequency = frequency; }
    public List<Integer> getDaysOfWeek() { return daysOfWeek; }
    public void setDaysOfWeek(List<Integer> daysOfWeek) { this.daysOfWeek = daysOfWeek == null ? new ArrayList<>() : daysOfWeek; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public List<String> getCompletedDates() { return completedDates; }
    public void setCompletedDates(List<String> completedDates) { this.completedDates = completedDates == null ? new ArrayList<>() : completedDates; }
}