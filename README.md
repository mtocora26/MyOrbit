# MyOrbit

App móvil (PWA) para estudiantes: tareas con subtareas, hábitos, categorías y materias, con roles de usuario y administración.

- **Backend**: Spring Boot 4 (Java 21) + MongoDB, en `backend/`.
- **Frontend**: React 19 + Vite + Tailwind, en `frontend/`.

## Requisitos

- Java 21
- Node.js 22 y pnpm
- MongoDB local o Atlas (ver [backend/MONGODB_SETUP.md](backend/MONGODB_SETUP.md))
- Docker (solo para los tests de integración)

## Backend

```bash
cd backend
cp application-local.properties.example application-local.properties   # ajusta la URI de Mongo
./mvnw spring-boot:run                                                  # http://localhost:8080
./mvnw test                                                             # tests (Testcontainers levanta su Mongo)
```

Propiedades útiles (en `application-local.properties`): `myorbit.admin-emails`, `myorbit.session-ttl`, `myorbit.cors.allowed-origins`.

## Frontend

```bash
cd frontend
pnpm install
pnpm dev          # http://localhost:8443, /api se redirige al backend (VITE_DEV_API_TARGET, por defecto :8080)
pnpm typecheck
pnpm build
```

## Endpoints

Todos, salvo registro y login, exigen `Authorization: Bearer <token>`. Los errores responden `ProblemDetail`.
El detalle de materias está en [docs/API.md](docs/API.md).

| Módulo | Ruta | Operaciones |
|---|---|---|
| Auth | `/api/auth` | `POST /register`, `POST /login`, `GET /me`, `POST /logout` |
| Perfil | `/api/profile` | `GET`, `PUT` |
| Tareas | `/api/tasks` | `GET`, `POST`, `GET /{id}`, `PUT /{id}`, `PATCH /{id}/status`, `DELETE /{id}` |
| Subtareas | `/api/tasks/{id}/subtasks` | `POST`, `POST /{parentSubtaskId}`, `PUT /{subtaskId}`, `PATCH /{subtaskId}/status`, `DELETE /{subtaskId}` |
| Hábitos | `/api/habits` | `GET`, `POST`, `PUT /{id}`, `GET /{id}/stats`, `PATCH /{id}/completion`, `DELETE /{id}` |
| Categorías | `/api/categories` | `GET`, `POST`, `PUT`, `DELETE` |
| Notificaciones | `/api/notifications` | `GET`, `GET /unread-count`, `GET`/`PUT /preferences`, `PATCH /{id}/read`, `PATCH /read-all` |
| Materias | `/api/subjects` | `GET`, `POST`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}` |
| Admin | `/api/admin/users` | `GET`, `POST`, `PATCH /{id}`, `DELETE /{id}` (solo rol ADMIN) |

## Más documentación

- [docs/BACKLOG.md](docs/BACKLOG.md): hitos y tareas
- [docs/BUENAS_PRACTICAS.md](docs/BUENAS_PRACTICAS.md): estructura y convenciones
- [ARQUITECTURA_Y_PATRONES.md](ARQUITECTURA_Y_PATRONES.md)
