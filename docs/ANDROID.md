# App Android (Capacitor)

MyOrbit se empaqueta como app instalable con **Capacitor**: el mismo build de la web dentro de un WebView, hablando con el mismo backend de Render. Solo Android; iOS exige un Mac y una cuenta de Apple Developer de pago.

- **Id de la app:** `com.app.myorbit` (`frontend/capacitor.config.ts`). Es permanente una vez publicada en una tienda: cámbialo antes, no después.
- **Código web y nativo comparten todo**: no hay pantallas distintas. Lo propio de Android vive en `frontend/src/hooks/useNativeApp.ts` (splash y botón «atrás») y en `frontend/android/`.

## Requisitos

- Node 22+ y pnpm, JDK 21 (el de Android Studio puede ser más nuevo: Gradle necesita 21, así que apunta `JAVA_HOME` a un JDK 21).
- Android Studio con el SDK (la primera compilación descarga la Platform 36 y las Build-Tools 35 si faltan; requiere haber aceptado las licencias en Android Studio).
- Memoria: Gradle y el emulador son pesados. Con menos de ~3 GB libres, cierra el navegador antes y compila con `--no-daemon -Dorg.gradle.jvmargs=-Xmx1g`.

## Compilar el APK de prueba

```bash
cd frontend
pnpm build:android          # vite build --mode android + cap sync (copia dist/ al proyecto Android)
cd android
./gradlew assembleDebug     # en Windows: gradlew.bat assembleDebug
# → frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

`pnpm android:debug` hace los tres pasos seguidos. Para instalarlo: `adb install -r app-debug.apk`, o abre `frontend/android/` en Android Studio y pulsa *Run*.

### Qué cambia en el modo `android`

| | Web (`pnpm build`) | App (`pnpm build:android`) |
|---|---|---|
| API | ruta relativa (`/api`, proxy o nginx) | `VITE_API_BASE_URL` de `frontend/.env.android` (la URL de Render) |
| Service worker y manifest | sí (PWA) | no: el APK ya trae los archivos |
| Origen de la página | el dominio del frontend | `https://localhost` |

Para apuntar la app a otro backend sin tocar el archivo: `VITE_API_BASE_URL=https://otro.onrender.com pnpm build:android`.

## Obligatorio en el backend: CORS

El WebView sirve la app desde **`https://localhost`**. Ese origen debe estar en la variable `MYORBIT_CORS_ALLOWED_ORIGINS` de Render (separado por comas de la URL del frontend web, sin `/` final):

```
MYORBIT_CORS_ALLOWED_ORIGINS=https://tu-frontend.workers.dev,https://localhost
```

Sin eso la app abre, pero el inicio de sesión falla con «No se pudo conectar con el servidor» (la API responde 403 al origen). Compruébalo con:

```bash
curl -s -i -X OPTIONS BACKEND/api/habits -H "Origin: https://localhost" -H "Access-Control-Request-Method: GET" | grep -i "^HTTP\|access-control-allow-origin"
# esperado: 200 y access-control-allow-origin: https://localhost
```

## Íconos y pantalla de arranque

Las fuentes están en `frontend/assets/` (ver su README) y los recursos generados ya están en `frontend/android/app/src/main/res/`. Si cambia el logo, regenera:

```bash
cd frontend
pnpm exec capacitor-assets generate --android --iconBackgroundColor '#FF6B4A' --iconBackgroundColorDark '#FF6B4A' --splashBackgroundColor '#EEF1F6' --splashBackgroundColorDark '#0C1527'
```

### Splash animado (qué es nativo y qué es web)

El arranque tiene tres tramos con el mismo fondo (`paper`: `#EEF1F6` claro, `#0C1527` oscuro) y el mismo logo de 120 px/dp centrado, para que el relevo no salte:

1. **Splash del sistema (nativo, Android 12+).** Ícono animado: los arcos se trazan y aparecen las dos estaciones en ~0,8 s. Vive en `android/app/src/main/res/`: `drawable-v31/splash_orbit.xml` (animated-vector), `drawable/splash_orbit_vector.xml` (el dibujo, estado inicial sin trazar), `animator/splash_*.xml` (tiempos) y `values*/splash_colors.xml` (fondo claro/oscuro). Los atributos están en `AppTheme.NoActionBarLaunch` (`styles.xml`). El sistema admite hasta ~1 s; con «eliminar animaciones» activo salta al logo completo. En Android 11 y anteriores se ve el logo quieto (`drawable/splash_orbit.xml` y el PNG heredado de `splash.png`).
2. **HTML de arranque (web).** `#boot` en `index.html`: el mismo logo estático sobre el mismo fondo, que se pinta antes de que cargue React. Un script aplica antes el tema guardado.
3. **`BootScreen` (React).** `OrbitLoader` en movimiento mientras se confirma la sesión. Solo si hay sesión guardada, y como mucho 1,2 s (`BOOT_MAX_MS` en `App.tsx`): después se muestra lo guardado y las pantallas siguen con sus esqueletos. Sin sesión se abre el acceso sin esperas.

La misma animación (`OrbitLoader`) se reutiliza al **volver tras 30 min o más en segundo plano** (`useResume`: revalida la sesión y los datos; entre 0,5 y 3 s) y en el botón **Reintentar** del aviso «Servidor inalcanzable». Con movimiento reducido (`prefers-reduced-motion`) el logo queda quieto.

El splash se oculta en cuanto React pinta la primera pantalla (`hideSplash()` en `App.tsx`); si algo falla, Capacitor lo oculta solo a los 3 s. Para ver la animación nativa a cámara lenta: `adb shell settings put global animator_duration_scale 10` (y `1` al terminar).

## Comportamiento nativo

- **Botón «atrás»:** sube un nivel (subpantalla → pestaña → Hoy) y solo desde Hoy cierra la app. Una hoja inferior abierta lo atiende primero. Con el teclado en pantalla, el primer «atrás» lo oculta (lo hace Android) y el segundo cierra la hoja.
- **Teclado:** el viewport se reduce (`interactive-widget=resizes-content`), así que el campo enfocado queda visible.
- **Áreas seguras:** Capacitor deja el contenido entre la barra de estado y la de gestos.
- **Sesión:** vive en el `localStorage` del WebView y sobrevive a cerrar y reabrir la app.

## Depurar

Con el emulador o un teléfono en modo depuración: abre `chrome://inspect` en Chrome de escritorio y elige el WebView de MyOrbit para ver la consola y el DOM de la app instalada. Las peticiones de red, errores de CORS y `localStorage` se ven ahí.

## Distribución

La app **no se publica en Play Store**: se instala el APK de depuración (`pnpm android:debug`, luego `adb install -r app-debug.apk`). Por eso no hay *keystore* ni `signingConfigs`. Si algún día se publica, hace falta crear un keystore propio (un secreto: no va a git), configurar `signingConfigs` en `frontend/android/app/build.gradle` leyendo sus claves de un `keystore.properties` ignorado por git, y generar el AAB con `./gradlew bundleRelease`.

## Orientación

La app queda **fija en vertical** (`android:screenOrientation="portrait"` en `AndroidManifest.xml`), igual que la PWA (`orientation: 'portrait'` en `vite.config.ts`): se usa con una mano y las pantallas están pensadas para 360–390 px de ancho.

## Avisos en el teléfono (notificaciones locales)

La app programa sus propios avisos con `@capacitor/local-notifications` (`frontend/src/services/localReminders.ts`): Android los dispara a su hora **sin internet y con la app cerrada**, sin Firebase ni servidor. Se programan los próximos 7 días (máximo 60) para:

| Aviso | Cuándo suena | Preferencia que lo controla |
|---|---|---|
| Clase | 30 min antes | Clases y eventos |
| Evento con hora | A su hora de inicio | Clases y eventos |
| Recordatorio personal | A su hora | Recordatorios personales |
| Fecha límite de una tarea | 1 día y 1 hora antes | Fechas límite |
| Parcial o presentación (evaluación con fecha) | 1 día antes, 1 hora antes y a la hora exacta | Parciales próximos |

- Se recalculan al iniciar sesión, al volver a la app, al cambiar tareas/hábitos/recordatorios y al cambiar las preferencias. Sin conexión se conserva lo ya programado; al cerrar sesión se cancela todo.
- El permiso de notificaciones se pide al crear el primer recordatorio, o con el interruptor «Avisos en este teléfono» del Perfil. Nunca al abrir la app.
- Para que suenen a la hora exacta, Android 12+ exige el permiso «Alarmas y recordatorios». Ajustes se abre solo cuando el usuario lo toca: al activar «Avisos en este teléfono» o con «Permitir» en la hoja «Que tus avisos lleguen». Mientras falte, los avisos se programan como inexactos (`isExactNotification: false`; con el valor por defecto el plugin abriría Ajustes en cada reprogramación) y el sistema puede retrasarlos varios minutos; algunos fabricantes (Xiaomi, Huawei...) además retrasan avisos con el ahorro de batería agresivo.
- Un cambio hecho desde otro dispositivo (la web) llega al teléfono cuando la app se abre; los avisos no se actualizan solos en segundo plano.
- Quedan fuera: hábitos pendientes, tareas vencidas y materias en riesgo (siguen llegando a la bandeja), y FCM (push remoto).

- Al iniciar sesión, una hoja («Que tus avisos lleguen») revisa notificaciones, alarmas exactas, batería sin restricciones y el inicio automático del fabricante (Tecno, Xiaomi, Huawei, Oppo, Vivo), y lleva directo a cada ajuste. Se reabre desde Perfil → Notificaciones. Sin el inicio automático, capas como HiOS (Griffin) matan la app al cerrarla y la alarma se pierde.
- Los avisos usan el canal nativo `avisos` (`MainActivity.java`) con prioridad alta, sonido y vibración; el canal por defecto del plugin no sonaba.

## Widget «Agenda de hoy»

Widget de pantalla de inicio con lo que queda del día: clases, eventos, evaluaciones sin nota y tareas pendientes. Solo existe en el APK (una PWA no puede crear widgets de Android).

- **Agregarlo:** Perfil → Widget de agenda → «Agregar a la pantalla de inicio», o mantener presionada la pantalla de inicio → Widgets → MyOrbit. Algunos lanzadores no aceptan la petición desde la app: queda el camino manual.
- **Datos:** la web arma hoy y los 6 días siguientes (`frontend/src/services/agendaWidget.ts`) y los entrega al plugin `AgendaWidget`, que los guarda en el teléfono. El widget no usa la red.
- **Cuándo se actualizan los datos:** al iniciar sesión, al abrir o salir de la app y al crear cosas. Lo hecho en otro dispositivo llega al abrir la app. Sin conexión se conserva lo último guardado.
- **Cuándo se repinta:** al guardar datos, cuando algo termina, al cambiar de día o de zona horaria y cada 30 minutos. La alarma es inexacta y no despierta el teléfono.
- **Qué deja de verse:** una clase o un evento al terminar, una evaluación dos horas después de empezar; las tareas siguen hasta que acaba el día.
- **Estados:** sin sesión («Abre MyOrbit para ver tu agenda»), sin pendientes y datos vencidos (pasados los 7 días sin abrir la app). Cerrar sesión borra los datos.
- **Tocarlo** abre `myorbit://agenda`, que la app atiende con `useLaunchLink` para mostrar la Agenda.
- **Tema:** sigue el del teléfono, no el ajuste «Modo oscuro» de la app. Usa la letra del sistema.
- **Código nativo:** `AgendaWidgetProvider.java` (pinta), `AgendaWidgetModel.java` (reglas, con pruebas en `./gradlew testDebugUnitTest`) y `AgendaWidgetPlugin.java`; recursos `widget_*` en `res/`.

## Estado de red

`frontend/src/services/connection.ts` distingue sin red, servidor inalcanzable y conexión recuperada. En la app usa `@capacitor/network`, porque `navigator.onLine` es poco fiable.

## Datos sin conexión

La app y la PWA guardan una copia de cada lectura de la API (`GET`) en IndexedDB (`frontend/src/services/offlineStore.ts`, enganchada al `fetch` global en `apiError.ts`). Si después no hay red o el servidor no responde (502/503/504), ese mismo `GET` devuelve la última copia y las pantallas siguen mostrando lo último que se vio, con el aviso «Mostrando lo guardado el …».

- **Por usuario:** la clave lleva el id de la sesión. Cerrar sesión o entrar con otra cuenta borra toda la copia.
- **Qué no se guarda:** `/api/auth`, `/api/push`, `/api/admin`, ni respuestas que no sean JSON correcto. Un 401 o un 4xx nunca se reemplaza por la copia.
- **Escritura:** sin red, las tareas se pueden crear, editar, marcar y borrar; los cambios quedan en una cola (`outbox.ts`) y se envían al volver la conexión (reglas de conflicto en [API.md](API.md)). Las subtareas y los demás módulos fallan con «No se pudo conectar con el servidor».
- **Tope y versión:** máximo 150 copias (se descartan las más viejas); si cambia `DB_VERSION` la copia anterior se descarta.
- **Límite conocido:** si el servidor está dormido (Render tarda ~30 s en despertar) y la petición no falla, sino que tarda, se ve el esqueleto hasta que responde. La copia solo entra cuando la petición falla.
- Sirve también a los avisos locales: `localReminders.ts` planifica con la copia cuando el servidor no responde.
