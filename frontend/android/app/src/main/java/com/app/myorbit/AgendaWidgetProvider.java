package com.app.myorbit;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.RemoteViews;

import androidx.core.content.ContextCompat;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * Widget «Agenda de hoy». Pinta lo que la web guardó con {@link AgendaWidgetPlugin}: no pide nada a la red, así que
 * funciona con la app cerrada y sin conexión. Se repinta cada 30 minutos, cuando algo termina y al cambiar el día.
 */
public class AgendaWidgetProvider extends AppWidgetProvider {
    private static final String TAG = "AgendaWidget";
    private static final String PREFERENCES = "agenda_widget";
    static final String DATA_KEY = "data";
    private static final String ACTION_REFRESH = "com.app.myorbit.widget.REFRESH";
    /** Lo abre {@code useLaunchLink} en la web. */
    private static final String AGENDA_LINK = "myorbit://agenda";
    /** Alto que se asume si el lanzador no informa el tamaño (dos celdas). */
    private static final int DEFAULT_HEIGHT_DP = 110;

    static SharedPreferences preferences(Context context) {
        return context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE);
    }

    static ComponentName component(Context context) {
        return new ComponentName(context, AgendaWidgetProvider.class);
    }

    static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        render(context, manager, manager.getAppWidgetIds(component(context)));
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        render(context, manager, ids);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int id, Bundle options) {
        render(context, manager, new int[]{id});
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        if (ACTION_REFRESH.equals(action) || Intent.ACTION_TIME_CHANGED.equals(action)
                || Intent.ACTION_TIMEZONE_CHANGED.equals(action)) {
            refreshAll(context);
        }
    }

    @Override
    public void onDisabled(Context context) {
        alarms(context).cancel(refreshIntent(context));
    }

    private static void render(Context context, AppWidgetManager manager, int[] ids) {
        if (ids.length == 0) return;
        Date now = new Date();
        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(now);

        String from = null;
        String to = null;
        List<AgendaWidgetModel.Item> items = new ArrayList<>();
        String stored = preferences(context).getString(DATA_KEY, null);
        if (stored != null) {
            try {
                JSONObject data = new JSONObject(stored);
                items = parseItems(data.getJSONArray("items"));
                from = data.getString("from");
                to = data.getString("to");
            } catch (JSONException e) {
                Log.w(TAG, "Datos del widget ilegibles: " + e.getMessage());
            }
        }
        List<AgendaWidgetModel.Item> upcoming = AgendaWidgetModel.upcoming(items, today, now.getTime());
        AgendaWidgetModel.State state = AgendaWidgetModel.state(from, to, today, upcoming.size());

        for (int id : ids) {
            int height = heightDp(manager.getAppWidgetOptions(id));
            manager.updateAppWidget(id, views(context, now, state, upcoming, height));
        }
        // Alarma inexacta y sin despertar el teléfono: basta con que el widget esté al día cuando se mira.
        alarms(context).set(AlarmManager.RTC, AgendaWidgetModel.nextChange(upcoming, nextMidnight(now)), refreshIntent(context));
    }

    private static RemoteViews views(Context context, Date now, AgendaWidgetModel.State state,
                                     List<AgendaWidgetModel.Item> upcoming, int heightDp) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_agenda);
        // «jue 26 nov»: según la versión de Android las abreviaturas traen punto.
        String date = new SimpleDateFormat("EEE d MMM", Locale.forLanguageTag("es-CO")).format(now).replace(".", "");
        views.setTextViewText(R.id.widget_title, context.getString(R.string.widget_agenda_today, date));
        views.setOnClickPendingIntent(android.R.id.background, openAgenda(context));
        views.removeAllViews(R.id.widget_rows);

        boolean list = state == AgendaWidgetModel.State.LIST;
        views.setViewVisibility(R.id.widget_rows, list ? View.VISIBLE : View.GONE);
        views.setViewVisibility(R.id.widget_message, list ? View.GONE : View.VISIBLE);
        views.setViewVisibility(R.id.widget_more, View.GONE);
        if (!list) {
            int message = state == AgendaWidgetModel.State.EMPTY ? R.string.widget_agenda_empty
                    : state == AgendaWidgetModel.State.STALE ? R.string.widget_agenda_stale
                    : R.string.widget_agenda_no_data;
            views.setTextViewText(R.id.widget_message, context.getString(message));
            return views;
        }

        float fontScale = context.getResources().getConfiguration().fontScale;
        int shown = AgendaWidgetModel.shownRows(heightDp, fontScale, upcoming.size());
        for (AgendaWidgetModel.Item item : upcoming.subList(0, shown)) {
            views.addView(R.id.widget_rows, row(context, item));
        }
        int hidden = upcoming.size() - shown;
        if (hidden > 0) {
            views.setViewVisibility(R.id.widget_more, View.VISIBLE);
            views.setTextViewText(R.id.widget_more, context.getString(R.string.widget_agenda_more, hidden));
        }
        return views;
    }

    private static RemoteViews row(Context context, AgendaWidgetModel.Item item) {
        RemoteViews row = new RemoteViews(context.getPackageName(), R.layout.widget_agenda_row);
        row.setTextViewText(R.id.widget_row_time,
                item.time.isEmpty() ? context.getString(R.string.widget_agenda_all_day) : item.time);
        // Mismas marcas que la Agenda: clase = rombo, evaluación = cuadrado, evento = cápsula, tarea = círculo.
        int marker = "class".equals(item.kind) ? R.drawable.widget_marker_class
                : "evaluation".equals(item.kind) ? R.drawable.widget_marker_evaluation
                : "event".equals(item.kind) ? R.drawable.widget_marker_event
                : R.drawable.widget_marker_task;
        row.setImageViewResource(R.id.widget_row_marker, marker);
        row.setInt(R.id.widget_row_marker, "setColorFilter", color(context, item.color));
        row.setTextViewText(R.id.widget_row_title, item.title);
        row.setTextViewText(R.id.widget_row_detail, item.detail);
        row.setViewVisibility(R.id.widget_row_detail, item.detail.isEmpty() ? View.GONE : View.VISIBLE);
        return row;
    }

    private static List<AgendaWidgetModel.Item> parseItems(JSONArray array) throws JSONException {
        List<AgendaWidgetModel.Item> items = new ArrayList<>(array.length());
        for (int index = 0; index < array.length(); index += 1) {
            JSONObject item = array.getJSONObject(index);
            items.add(new AgendaWidgetModel.Item(item.getString("date"), item.optString("time"), item.optString("kind"),
                    item.getString("title"), item.optString("detail"), item.optString("color"), item.getLong("expiresAt")));
        }
        return items;
    }

    private static int color(Context context, String hex) {
        if (!hex.isEmpty()) {
            try {
                return Color.parseColor(hex);
            } catch (IllegalArgumentException e) {
                Log.w(TAG, "Color no reconocido: " + hex);
            }
        }
        return ContextCompat.getColor(context, R.color.widget_coral);
    }

    /** En vertical, el alto real del widget es el máximo que informa el lanzador. */
    private static int heightDp(Bundle options) {
        int height = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT);
        if (height <= 0) height = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT);
        return height > 0 ? height : DEFAULT_HEIGHT_DP;
    }

    private static long nextMidnight(Date now) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(now);
        calendar.add(Calendar.DAY_OF_MONTH, 1);
        calendar.set(Calendar.HOUR_OF_DAY, 0);
        calendar.set(Calendar.MINUTE, 0);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        return calendar.getTimeInMillis();
    }

    private static PendingIntent openAgenda(Context context) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(AGENDA_LINK), context, MainActivity.class);
        return PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static PendingIntent refreshIntent(Context context) {
        Intent intent = new Intent(context, AgendaWidgetProvider.class).setAction(ACTION_REFRESH);
        return PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static AlarmManager alarms(Context context) {
        return (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
    }
}
