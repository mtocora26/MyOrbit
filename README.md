# MyOrbit

App móvil para estudiantes universitarios: tareas con subtareas, agenda (clases, eventos, evaluaciones y entregas), materias y notas por corte, hábitos y notificaciones, con roles de usuario y administración. La interfaz es solo en español.

Se usa como **PWA** en el navegador o como **app de Android** (APK), que además programa avisos en el teléfono y tiene el widget «Agenda de hoy» en la pantalla de inicio.

- **Backend**: Spring Boot 4 (Java 21) + MongoDB, en `backend/`. Monolito modular ([ADR 0001](docs/adr/0001-monolito-modular.md)).
- **Frontend**: React 19 + Vite + Tailwind, en `frontend/`; la app Android usa Capacitor.

## Requisitos

- Java 21
- Node.js 22 y pnpm
- MongoDB local o Atlas (ver [backend/MONGODB_SETUP.md](backend/MONGODB_SETUP.md))
- Docker (solo para los tests de integración)
- Android Studio con el SDK (solo para compilar el APK)

## Backend

```bash
cd backend
cp application-local.properties.example application-local.properties   # ajusta la URI de Mongo
./mvnw spring-boot:run                                                  # http://localhost:8080
./mvnw test                                                             # tests (Testcontainers levanta su Mongo)
```

Con el backend corriendo, la referencia interactiva está en http://localhost:8080/swagger-ui.html y el JSON OpenAPI en `/v3/api-docs`. Pulsa **Authorize** y pega el token de `/api/auth/login`. El estado del servicio se consulta en `/actuator/health`.

Propiedades útiles (en `application-local.properties`): `myorbit.admin-emails`, `myorbit.session-ttl`, `myorbit.cors.allowed-origins`.

## Frontend

```bash
cd frontend
pnpm install
pnpm dev          # http://localhost:8443, /api se redirige al backend (VITE_DEV_API_TARGET, por defecto :8080)
pnpm typecheck
pnpm build
```

## App Android

```bash
cd frontend
pnpm android:debug   # APK en frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

La app apunta al backend de `frontend/.env.android`. Requisitos, instalación, avisos, widget y modo sin conexión: [docs/ANDROID.md](docs/ANDROID.md).

## Endpoints

Todos, salvo registro, login y `/actuator/health`, exigen `Authorization: Bearer <token>`. Los errores responden `ProblemDetail`.
Las reglas de negocio de cada módulo están en [docs/API.md](docs/API.md).

| Módulo | Ruta | Operaciones |
|---|---|---|
| Auth | `/api/auth` | `POST /register`, `POST /login`, `GET /me`, `PUT /me/name`, `PUT /me/password`, `PUT /me/timezone`, `POST /logout` |
| Perfil | `/api/profile` | `GET`, `PUT` |
| Tareas | `/api/tasks` | `GET`, `POST`, `GET /{id}`, `PUT /{id}`, `PATCH /{id}/status`, `DELETE /{id}` |
| Subtareas | `/api/tasks/{id}/subtasks` | `POST`, `POST /{parentSubtaskId}`, `PUT /{subtaskId}`, `PATCH /{subtaskId}/status`, `DELETE /{subtaskId}` |
| Categorías | `/api/categories` | `GET`, `POST`, `PUT /{id}`, `DELETE /{id}` |
| Semestres | `/api/semesters` | `GET`, `POST`, `PUT /{id}`, `DELETE /{id}` |
| Materias | `/api/subjects` | `GET`, `POST`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}` |
| Evaluaciones | `/api/subjects/{subjectId}/evaluations` | `GET`, `POST`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`, `GET /summary`, `GET /overview` |
| Académico | `/api/academic` | `GET /overview`, `GET /summary`, `GET /classes`, `GET /classes/now`, `GET /evaluations` |
| Eventos | `/api/events` | `GET`, `POST`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}` |
| Hábitos | `/api/habits` | `GET`, `POST`, `GET /summary`, `PUT /{id}`, `GET /{id}/stats`, `GET /{id}/monthly-goal`, `PATCH /{id}/completion`, `DELETE /{id}` |
| Notificaciones | `/api/notifications` | `GET`, `GET /unread-count`, `GET`/`PUT /preferences`, `PATCH /{id}/read`, `PATCH /read-all` |
| Recordatorios | `/api/reminders` | `GET`, `POST`, `DELETE /{id}` |
| Push | `/api/push` | `GET /config`, `GET`/`POST`/`DELETE /subscriptions` |
| Admin | `/api/admin/users` | `GET`, `POST`, `PATCH /{id}`, `DELETE /{id}` (solo rol ADMIN) |

## Más documentación

- [PRODUCT.md](PRODUCT.md) y [DESIGN.md](DESIGN.md): producto y sistema visual
- [ARQUITECTURA_Y_PATRONES.md](ARQUITECTURA_Y_PATRONES.md) y [docs/BUENAS_PRACTICAS.md](docs/BUENAS_PRACTICAS.md): estructura, patrones y convenciones
- [docs/API.md](docs/API.md): detalle de la API
- [docs/ANDROID.md](docs/ANDROID.md): app Android
- [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md): despliegue en Render, Cloudflare y Atlas
- [docs/DISENO_MOVIL.md](docs/DISENO_MOVIL.md) y [CONTRIBUTING.md](CONTRIBUTING.md): flujo de trabajo
- [docs/BACKLOG.md](docs/BACKLOG.md): backlog inicial por hitos
