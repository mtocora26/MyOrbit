package com.app.myorbit;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Ajustes del fabricante que deciden si un aviso programado llega con la app cerrada: la optimización de batería de
 * Android y el «inicio automático» de capas como HiOS (Tecno), MIUI, EMUI, ColorOS o Funtouch. Android no permite
 * saber si el inicio automático está activo; solo si la pantalla existe en este teléfono y abrirla.
 */
@CapacitorPlugin(name = "DeviceSettings")
public class DeviceSettingsPlugin extends Plugin {
    /** Pantallas de «inicio automático» conocidas: paquete y actividad. */
    private static final String[][] AUTOSTART_SCREENS = {
            {"com.transsion.phonemaster", "com.cyin.himgr.autostart.AutoStartActivity"},
            {"com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"},
            {"com.huawei.systemmanager", "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity"},
            {"com.huawei.systemmanager", "com.huawei.systemmanager.optimize.process.ProtectActivity"},
            {"com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity"},
            {"com.oppo.safe", "com.oppo.safe.permission.startup.StartupAppListActivity"},
            {"com.vivo.permissionmanager", "com.vivo.permissionmanager.activity.BgStartUpManagerActivity"},
            {"com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.BgStartUpManager"},
    };

    @PluginMethod
    public void batteryStatus(PluginCall call) {
        PowerManager power = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        JSObject result = new JSObject();
        result.put("unrestricted", Build.VERSION.SDK_INT < Build.VERSION_CODES.M
                || (power != null && power.isIgnoringBatteryOptimizations(getContext().getPackageName())));
        call.resolve(result);
    }

    /** Muestra el diálogo del sistema «¿Permitir que la app funcione siempre en segundo plano?». */
    @PluginMethod
    public void requestUnrestrictedBattery(PluginCall call) {
        Intent request = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                Uri.parse("package:" + getContext().getPackageName()));
        if (!launch(request)) launch(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS));
        call.resolve();
    }

    @PluginMethod
    public void autoStartStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", findAutoStartScreen() != null);
        call.resolve(result);
    }

    /** Abre la pantalla de inicio automático del fabricante; si no hay, los ajustes de la app. */
    @PluginMethod
    public void openAutoStart(PluginCall call) {
        Intent screen = findAutoStartScreen();
        boolean opened = screen != null && launch(screen);
        if (!opened) opened = openAppDetails();
        JSObject result = new JSObject();
        result.put("opened", opened);
        call.resolve(result);
    }

    private Intent findAutoStartScreen() {
        PackageManager packages = getContext().getPackageManager();
        for (String[] screen : AUTOSTART_SCREENS) {
            ComponentName component = new ComponentName(screen[0], screen[1]);
            try {
                packages.getActivityInfo(component, 0);
                return new Intent().setComponent(component);
            } catch (PackageManager.NameNotFoundException ignored) {
                // Esta pantalla no existe en este teléfono.
            }
        }
        return null;
    }

    private boolean openAppDetails() {
        return launch(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                Uri.parse("package:" + getContext().getPackageName())));
    }

    private boolean launch(Intent intent) {
        try {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            return true;
        } catch (RuntimeException e) {
            return false;
        }
    }
}
