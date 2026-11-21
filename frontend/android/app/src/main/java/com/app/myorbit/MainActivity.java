package com.app.myorbit;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    /** Canal de los avisos programados; el mismo id se usa en {@code localReminders.ts}. */
    static final String REMINDERS_CHANNEL_ID = "avisos";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DeviceSettingsPlugin.class);
        super.onCreate(savedInstanceState);
        createRemindersChannel();
    }

    /**
     * Los ajustes de un canal no se pueden cambiar una vez creado, y el canal «Default» del plugin no vibra y
     * depende de una ruta de sonido que algunos teléfonos ignoran. Este canal fija sonido, vibración y
     * prioridad alta (aviso emergente) de forma explícita.
     */
    private void createRemindersChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(REMINDERS_CHANNEL_ID, "Avisos", NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Clases, eventos, parciales, recordatorios y fechas límite");
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[]{0, 300, 200, 300});
        channel.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
                new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build());
        channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PRIVATE);
        getSystemService(NotificationManager.class).createNotificationChannel(channel);
    }
}
