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

## Versión firmada (AAB) para tiendas

**Pendiente, necesita un *keystore* tuyo** (es un secreto: no lo subas a git). Pasos:

1. Crea el keystore (`keytool -genkeypair ...`) y guárdalo fuera del repo con su contraseña.
2. Configura `signingConfigs` en `frontend/android/app/build.gradle` leyendo las rutas y claves de variables de entorno o de un `keystore.properties` ignorado por git.
3. `./gradlew bundleRelease` → `app/build/outputs/bundle/release/app-release.aab`.
4. Sube a Play Console. Sube el `versionCode`/`versionName` de `app/build.gradle` en cada publicación.

## Notificaciones y estado de red

Fuera de este alcance: las notificaciones nativas son #142, y el aviso de conexión con `@capacitor/network` es la parte B de #178.
