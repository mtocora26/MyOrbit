package com.app.myorbit;

import android.appwidget.AppWidgetManager;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Puente entre la web y el widget «Agenda de hoy»: guarda los datos, los borra y pide agregar el widget. */
@CapacitorPlugin(name = "AgendaWidget")
public class AgendaWidgetPlugin extends Plugin {
    @PluginMethod
    public void save(PluginCall call) {
        String data = call.getString("data");
        if (data == null) {
            call.reject("Faltan los datos del widget");
            return;
        }
        AgendaWidgetProvider.preferences(getContext()).edit().putString(AgendaWidgetProvider.DATA_KEY, data).apply();
        AgendaWidgetProvider.refreshAll(getContext());
        call.resolve();
    }

    @PluginMethod
    public void clear(PluginCall call) {
        AgendaWidgetProvider.preferences(getContext()).edit().clear().apply();
        AgendaWidgetProvider.refreshAll(getContext());
        call.resolve();
    }

    @PluginMethod
    public void status(PluginCall call) {
        AppWidgetManager manager = AppWidgetManager.getInstance(getContext());
        JSObject result = new JSObject();
        result.put("canPin", Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && manager.isRequestPinAppWidgetSupported());
        result.put("added", manager.getAppWidgetIds(AgendaWidgetProvider.component(getContext())).length > 0);
        call.resolve(result);
    }

    /** El lanzador muestra su propia confirmación; el usuario decide. */
    @PluginMethod
    public void pin(PluginCall call) {
        boolean requested = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AppWidgetManager manager = AppWidgetManager.getInstance(getContext());
            try {
                requested = manager.isRequestPinAppWidgetSupported()
                        && manager.requestPinAppWidget(AgendaWidgetProvider.component(getContext()), null, null);
            } catch (IllegalStateException e) {
                // Android solo acepta la petición con la app en primer plano.
                requested = false;
            }
        }
        JSObject result = new JSObject();
        result.put("requested", requested);
        call.resolve(result);
    }
}
