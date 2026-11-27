package com.app.myorbit;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class AgendaWidgetModelTest {
    private static AgendaWidgetModel.Item item(String date, String title, long expiresAt) {
        return new AgendaWidgetModel.Item(date, "08:00", "task", title, "", "", expiresAt);
    }

    @Test
    public void upcomingKeepsOnlyTodayAndWhatHasNotEnded() {
        List<AgendaWidgetModel.Item> items = Arrays.asList(
                item("2026-11-25", "ayer", 500), item("2026-11-26", "ya pasó", 100),
                item("2026-11-26", "pendiente", 300), item("2026-11-27", "mañana", 900));

        List<AgendaWidgetModel.Item> upcoming = AgendaWidgetModel.upcoming(items, "2026-11-26", 200);

        assertEquals(1, upcoming.size());
        assertEquals("pendiente", upcoming.get(0).title);
    }

    @Test
    public void stateDependsOnTheDaysCovered() {
        assertEquals(AgendaWidgetModel.State.NO_DATA, AgendaWidgetModel.state(null, null, "2026-11-26", 0));
        assertEquals(AgendaWidgetModel.State.STALE, AgendaWidgetModel.state("2026-11-18", "2026-11-24", "2026-11-26", 0));
        assertEquals(AgendaWidgetModel.State.STALE, AgendaWidgetModel.state("2026-11-27", "2026-12-03", "2026-11-26", 0));
        assertEquals(AgendaWidgetModel.State.EMPTY, AgendaWidgetModel.state("2026-11-26", "2026-12-02", "2026-12-02", 0));
        assertEquals(AgendaWidgetModel.State.LIST, AgendaWidgetModel.state("2026-11-26", "2026-12-02", "2026-11-26", 2));
    }

    @Test
    public void allRowsAreShownWhenTheyFit() {
        // 52 de encabezado y márgenes + 3 filas de 28 caben en 140 dp.
        assertEquals(3, AgendaWidgetModel.shownRows(140, 1f, 3));
        assertEquals(0, AgendaWidgetModel.shownRows(140, 1f, 0));
    }

    @Test
    public void roomIsKeptForTheMoreLine() {
        // En 140 dp caben 3 filas, pero con «+N más» solo 2.
        assertEquals(2, AgendaWidgetModel.shownRows(140, 1f, 5));
    }

    @Test
    public void aLargerFontShowsFewerRowsButAlwaysOne() {
        assertEquals(3, AgendaWidgetModel.shownRows(200, 1.3f, 3));
        assertEquals(2, AgendaWidgetModel.shownRows(180, 1.5f, 6));
        assertEquals(1, AgendaWidgetModel.shownRows(60, 1f, 6));
    }

    @Test
    public void nextChangeIsTheFirstEndingOrMidnight() {
        assertEquals(1000, AgendaWidgetModel.nextChange(Collections.emptyList(), 1000));
        assertEquals(400, AgendaWidgetModel.nextChange(
                Arrays.asList(item("d", "a", 700), item("d", "b", 400)), 1000));
    }
}
