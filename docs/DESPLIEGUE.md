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

| Variable | Valor |
|---|---|
| `SPRING_MONGODB_URI` | URI de Atlas |
| `SPRING_MONGODB_DATABASE` | `myorbit` |
| `MYORBIT_CORS_ALLOWED_ORIGINS` | URL del frontend, sin `/` final (p. ej. `https://myorbit.pages.dev`) |
| `MYORBIT_ADMIN_EMAILS` | Correos con rol ADMIN al registrarse, separados por coma |
| `MYORBIT_SESSION_TTL` | `30d` (opcional) |
| `MYORBIT_REMINDERS_ENABLED` | `true` para activar recordatorios (opcional) |
| `TZ` | `UTC` (los recordatorios usan la zona horaria de cada usuario) |
| `JAVA_TOOL_OPTIONS` | `-Xmx380m` en el plan gratuito (512 MB) |

> **Recordatorios:** el planificador (`@Scheduled`) solo corre con la instancia encendida. En el plan gratuito
> Render duerme el servicio tras ~15 min sin tráfico, así que los recordatorios no se envían mientras duerme.
> Para recordatorios fiables hace falta un plan de pago o un ping externo periódico a `/actuator/health`.

## 3. Frontend en Cloudflare Pages
- **Root directory:** `frontend` · **Build command:** `pnpm install --frozen-lockfile && pnpm build` · **Output:** `dist`

| Variable | Valor |
|---|---|
| `VITE_API_BASE_URL` | URL del backend en Render, sin `/` final |
| `NODE_VERSION` | `22` |

`VITE_API_BASE_URL` se incrusta al compilar: si cambia, hay que redesplegar.
`frontend/public/_redirects` da el fallback del SPA (recargar en una ruta interna no devuelve 404).

## 4. Orden
1. Atlas → 2. Render (CORS puede ir vacío al inicio) → 3. Cloudflare con `VITE_API_BASE_URL` → 4. Volver a Render y poner la URL de Cloudflare en `MYORBIT_CORS_ALLOWED_ORIGINS`.

El `Dockerfile`/`nginx.conf` del frontend son para Docker Compose y no se usan en Cloudflare.
