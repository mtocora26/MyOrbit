# Despliegue

Backend en **Render** (Docker), frontend en **Cloudflare Pages**, base de datos en **MongoDB Atlas**.

## 1. MongoDB Atlas
1. Crea un cluster y un usuario con permisos mínimos sobre la base `myorbit`.
2. En *Network Access* permite `0.0.0.0/0` (Render gratis no tiene IP de salida fija).
3. Copia la URI `mongodb+srv://USUARIO:CONTRASENA@CLUSTER.mongodb.net/myorbit?retryWrites=true&w=majority`.
4. No apuntes entornos de prueba a la base real.

## 2. Backend en Render (Web Service)
- **Language:** Docker · **Root Directory:** `backend` · **Dockerfile Path:** `./Dockerfile`
- **Health Check Path:** `/actuator/health`
- El contenedor escucha en `$PORT` (Render lo inyecta; en local cae a 8080).

**Obligatorias** (sin ellas el servicio no arranca o el navegador no puede usarlo):

| Variable | Valor |
|---|---|
| `SPRING_MONGODB_URI` | URI de Atlas |
| `SPRING_MONGODB_DATABASE` | `myorbit` |
| `MYORBIT_CORS_ALLOWED_ORIGINS` | Orígenes que llaman a `/api`, separados por coma y **sin `/` final**: la URL del frontend (p. ej. `https://myorbit.pages.dev`) y, para la app Android de Capacitor, `https://localhost` (ver [ANDROID.md](ANDROID.md)). Por defecto solo permite `localhost:8443` y `localhost:5173`, así que **si falta, la web desplegada falla con un error de CORS** aunque la API responda. |

**Opcionales** (con su valor por defecto del código):

| Variable | Por defecto | Para qué |
|---|---|---|
| `MYORBIT_ADMIN_EMAILS` | vacío | Correos que reciben el rol ADMIN **al registrarse**. Sin esto no hay administradores. |
| `MYORBIT_SESSION_TTL` | `30d` | Duración de la sesión (`7d`, `12h`…). |
| `MYORBIT_REMINDERS_ENABLED` | **`true`** | Los recordatorios están **activos por defecto**. Pon `false` para apagarlos. |
| `MYORBIT_REMINDERS_HOUR` | `8` | Hora de la mañana (vencidas, evaluaciones, materias en riesgo), en la zona de cada usuario. |
| `MYORBIT_REMINDERS_HABIT_HOUR` | `20` | Hora del aviso de hábitos pendientes. |
| `MYORBIT_REMINDERS_CRON` | `0 0 * * * *` | Cada cuánto corre el planificador general (cada hora). |
| `MYORBIT_REMINDERS_CLASS_CRON` | `0 * * * * *` | Avisos de clase y de eventos con hora (cada minuto). |
| `TZ` | del sistema | `UTC`: los recordatorios usan la zona horaria de cada usuario, no la del servidor. |
| `JAVA_TOOL_OPTIONS` | — | `-Xmx380m` en el plan gratuito (512 MB). |

`PORT` lo inyecta Render y no se configura a mano.

> **Recordatorios:** el planificador (`@Scheduled`) solo corre con la instancia encendida. En el plan gratuito
> Render duerme el servicio tras ~15 min sin tráfico, así que los recordatorios no se envían mientras duerme.
> Para recordatorios fiables hace falta un plan de pago o un ping externo periódico a `/actuator/health`.

### Verificar el despliegue

Sustituye `BACKEND` por la URL de Render y `FRONT` por la del frontend. Ninguna de estas pruebas escribe datos.

```bash
# 1. El servicio está arriba y conectado a la base (200 y {"status":"UP"}; la primera vez tarda ~1 min si dormía)
curl -s -w "
%{http_code}
" BACKEND/actuator/health

# 2. La API exige sesión (debe ser 401, no 404 ni 500)
curl -s -o /dev/null -w "%{http_code}
" BACKEND/api/habits

# 3. CORS desde el frontend (debe devolver access-control-allow-origin con la URL de FRONT)
curl -s -i -X OPTIONS BACKEND/api/habits -H "Origin: FRONT" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: authorization" | grep -i "^HTTP|access-control"
```

| Síntoma | Causa probable |
|---|---|
| `/actuator/health` da `DOWN` o el servicio se reinicia en bucle | `SPRING_MONGODB_URI` mal escrita, contraseña con caracteres especiales sin codificar, o Atlas bloquea la IP (*Network Access*). |
| La API responde pero la web muestra «No se pudo conectar con el servidor» | Falta `MYORBIT_CORS_ALLOWED_ORIGINS`, o la URL lleva `/` final o `http` en vez de `https`. |
| El prueba 3 no trae `access-control-allow-origin` | El origen de `FRONT` no está en `MYORBIT_CORS_ALLOWED_ORIGINS`. |
| La web llama a `localhost` o a su propio dominio | `VITE_API_BASE_URL` no estaba definida al compilar el frontend: hay que redesplegarlo. |
| Nadie tiene rol admin | Falta `MYORBIT_ADMIN_EMAILS`, o el correo ya estaba registrado (el rol se asigna solo al registrarse). |
| Llegan avisos que no esperabas | `MYORBIT_REMINDERS_ENABLED` no está en `false`: por defecto están activos. |

## 3. Frontend en Cloudflare Pages
- **Root directory:** `frontend` · **Build command:** `pnpm install --frozen-lockfile && pnpm build` · **Output:** `dist`

| Variable | Valor |
|---|---|
| `VITE_API_BASE_URL` | URL del backend en Render, sin `/` final |
| `NODE_VERSION` | `22` |

`VITE_API_BASE_URL` se incrusta al compilar: si cambia, hay que redesplegar.
`frontend/wrangler.jsonc` publica `dist/` con `not_found_handling: single-page-application`, que da el fallback del SPA
(recargar en una ruta interna no devuelve 404). No uses `public/_redirects` con `/* /index.html 200`: en Workers Cloudflare
lo rechaza por bucle infinito.

## 4. Orden
1. Atlas → 2. Render (CORS puede ir vacío al inicio) → 3. Cloudflare con `VITE_API_BASE_URL` → 4. Volver a Render y poner la URL de Cloudflare en `MYORBIT_CORS_ALLOWED_ORIGINS`.

El `Dockerfile`/`nginx.conf` del frontend sirven para correrlo en un contenedor y no se usan en Cloudflare.
