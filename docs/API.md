# MyOrbit - API

Todas las rutas requieren la cabecera `Authorization: Bearer <token>` de la sesión (`/api/auth/login`).
Los errores responden `ProblemDetail` (RFC 9457) con el mensaje en `detail`.

La referencia completa del resto de módulos queda en #23 (README) y #31 (OpenAPI).

## Materias (`/api/subjects`)

Cada materia pertenece al usuario de la sesión; las de otro usuario responden 404.

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| `GET` | `/api/subjects` | | `200` lista ordenada por semestre (más reciente primero) y nombre |
| `GET` | `/api/subjects/{id}` | | `200` materia · `404` |
| `POST` | `/api/subjects` | `SubjectRequest` | `201` materia creada · `400` |
| `PUT` | `/api/subjects/{id}` | `SubjectRequest` | `200` materia actualizada · `400` · `404` |
| `DELETE` | `/api/subjects/{id}` | | `204` · `404` |

### `SubjectRequest`

| Campo | Tipo | Regla |
|---|---|---|
| `name` | string | Obligatorio, máximo 100 caracteres. Único por usuario dentro del mismo semestre (sin distinguir mayúsculas). |
| `credits` | entero | Obligatorio, entre 1 y 20. |
| `semester` | string | Obligatorio, formato `AAAA-1` o `AAAA-2` (ej. `2026-1`). |
| `color` | string | Opcional, hexadecimal `#RRGGBB`. Por defecto `#7A5AF8`. |

```json
{ "name": "Análisis Numérico", "credits": 3, "semester": "2026-1", "color": "#7A5AF8" }
```

### Respuesta

```json
{ "id": "6f1c…", "name": "Análisis Numérico", "credits": 3, "semester": "2026-1", "color": "#7A5AF8" }
```

### Errores

| Caso | HTTP | `detail` |
|---|---|---|
| Campo inválido | 400 | Mensaje de validación del campo |
| Nombre repetido en el semestre | 400 | `Ya tienes una materia con ese nombre en el semestre 2026-1` |
| Sin sesión | 401 | |
| Materia inexistente o de otro usuario | 404 | `Materia no encontrada` |
