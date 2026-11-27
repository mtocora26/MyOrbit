package com.app.myorbit;

import java.util.ArrayList;
import java.util.List;

/** Reglas del widget «Agenda de hoy», sin dependencias de Android para poder probarlas. */
final class AgendaWidgetModel {
    /** Alto del encabezado más los márgenes, en dp. */
    static final int CHROME_DP = 52;
    /** Alto de una fila con la letra a tamaño normal, en dp. */
    static final int ROW_DP = 28;
    /** Alto de la línea «+N más», en dp. */
    static final int MORE_DP = 20;

    enum State {
        /** Sin sesión o la app aún no ha entregado datos. */
        NO_DATA,
        /** Los datos guardados ya no cubren el día de hoy. */
        STALE,
        /** No queda nada hoy. */
        EMPTY,
        LIST
    }

    static final class Item {
        final String date;
        final String time;
        final String kind;
        final String title;
        final String detail;
        final String color;
        final long expiresAt;

        Item(String date, String time, String kind, String title, String detail, String color, long expiresAt) {
            this.date = date;
            this.time = time;
            this.kind = kind;
            this.title = title;
            this.detail = detail;
            this.color = color;
            this.expiresAt = expiresAt;
        }
    }

    private AgendaWidgetModel() {
    }

    /** Lo de hoy que todavía no ha pasado, en el orden recibido. */
    static List<Item> upcoming(List<Item> items, String today, long now) {
        List<Item> result = new ArrayList<>();
        for (Item item : items) {
            if (item.date.equals(today) && item.expiresAt > now) result.add(item);
        }
        return result;
    }

    /** Las fechas son AAAA-MM-DD, así que se comparan como texto. */
    static State state(String from, String to, String today, int upcoming) {
        if (from == null || to == null) return State.NO_DATA;
        if (today.compareTo(from) < 0 || today.compareTo(to) > 0) return State.STALE;
        return upcoming == 0 ? State.EMPTY : State.LIST;
    }

    /**
     * Cuántas filas se pintan en un widget de {@code heightDp}. Si no caben todas se reserva sitio para «+N más».
     * Siempre se pinta al menos una.
     */
    static int shownRows(int heightDp, float fontScale, int total) {
        float row = ROW_DP * Math.max(1f, fontScale);
        int fit = (int) ((heightDp - CHROME_DP) / row);
        if (total <= Math.max(1, fit)) return total;
        int fitWithMore = (int) ((heightDp - CHROME_DP - MORE_DP * Math.max(1f, fontScale)) / row);
        return Math.max(1, fitWithMore);
    }

    /** El próximo momento en que cambia lo que se ve: algo termina o empieza otro día. */
    static long nextChange(List<Item> upcoming, long nextMidnight) {
        long next = nextMidnight;
        for (Item item : upcoming) next = Math.min(next, item.expiresAt);
        return next;
    }
}
