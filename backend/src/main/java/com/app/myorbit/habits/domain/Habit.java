package com.app.myorbit.habits.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "habits")
public class Habit {
    @Id
    private String id;
    private String userId;
    private String title;
    private String frequency;
    private List<Integer> daysOfWeek = new ArrayList<>();
    private String color;
    private String icon;
    private List<String> completedDates = new ArrayList<>();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }
    public List<Integer> getDaysOfWeek() { return daysOfWeek; }
    public void setDaysOfWeek(List<Integer> daysOfWeek) { this.daysOfWeek = daysOfWeek == null ? new ArrayList<>() : daysOfWeek; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public List<String> getCompletedDates() { return completedDates; }
    public void setCompletedDates(List<String> completedDates) { this.completedDates = completedDates == null ? new ArrayList<>() : completedDates; }
}