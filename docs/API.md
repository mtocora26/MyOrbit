# MyOrbit - API

Todas las rutas requieren la cabecera `Authorization: Bearer <token>` de la sesión (`/api/auth/login`).
Los errores responden `ProblemDetail` (RFC 9457) con el mensaje en `detail`.

La lista de rutas de todos los módulos está en el [README](../README.md); la referencia completa llegará con OpenAPI (#31).

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

## Evaluaciones (`/api/subjects/{subjectId}/evaluations`)

Cada evaluación pertenece a una materia del usuario de la sesión. Si la materia o la evaluación no son del usuario, responden 404. Al eliminar una materia se eliminan sus evaluaciones.

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| `GET` | `/api/subjects/{subjectId}/evaluations` | | `200` lista · `404` |
| `GET` | `/api/subjects/{subjectId}/evaluations/{id}` | | `200` evaluación · `404` |
| `POST` | `/api/subjects/{subjectId}/evaluations` | `EvaluationRequest` | `201` evaluación creada · `400` · `404` |
| `PUT` | `/api/subjects/{subjectId}/evaluations/{id}` | `EvaluationRequest` | `200` evaluación actualizada · `400` · `404` |
| `DELETE` | `/api/subjects/{subjectId}/evaluations/{id}` | | `204` · `404` |

### `EvaluationRequest`

| Campo | Tipo | Regla |
|---|---|---|
| `name` | string | Obligatorio, máximo 100 caracteres. |
| `percentage` | número | Obligatorio, mayor que 0 y máximo 100. La suma de la materia no puede superar 100. |
| `grade` | número | Opcional (`null` hasta conocer la nota), entre 0 y 5. |

```json
{ "name": "Parcial 1", "percentage": 30, "grade": 4.5 }
```

### Respuesta

```json
{ "id": "a91d…", "subjectId": "6f1c…", "name": "Parcial 1", "percentage": 30.0, "grade": 4.5 }
```

### Errores

| Caso | HTTP | `detail` |
|---|---|---|
| Campo inválido | 400 | Mensaje de validación del campo |
| La suma supera 100% | 400 | `La suma de porcentajes no puede superar 100%. Disponible: 10%` |
| Sin sesión | 401 | |
| Materia inexistente o de otro usuario | 404 | `Materia no encontrada` |
| Evaluación inexistente | 404 | `Evaluacion no encontrada` |

## Resumen de notas (`GET /api/subjects/{subjectId}/evaluations/summary`)

Calcula la nota actual y la nota que se necesita en lo que falta para alcanzar la meta (estrategia `WeightedGradeStrategy`, escala 0–5).

| Parámetro | Tipo | Descripción |
|---|---|---|
| `target` | número, opcional | Meta de la materia (0–5). Si falta se usa `gradeTarget` del perfil; si tampoco es válido, 3.0. |

```json
{ "currentGrade": 3.6, "accumulatedPoints": 1.8, "gradedPercentage": 50.0, "remainingPercentage": 50.0,
  "targetGrade": 3.5, "requiredGrade": 3.4, "achievable": true }
```

| Campo | Significado |
|---|---|
| `currentGrade` | Promedio ponderado de lo ya calificado; `null` si no hay notas. |
| `accumulatedPoints` | Puntos ganados sobre la nota final (nota × porcentaje / 100). |
| `gradedPercentage` / `remainingPercentage` | Porcentaje calificado y por calificar (lo no planeado cuenta como pendiente). |
| `requiredGrade` | Promedio necesario en el porcentaje pendiente para llegar a la meta (0 si ya se alcanzó); `null` si no queda nada por calificar. |
| `achievable` | `false` si la nota necesaria supera 5 o, con todo calificado, no se llegó a la meta. |

Errores: `400` si `target` está fuera de 0–5, `401` sin sesión, `404` si la materia no existe o es de otro usuario.

## Fechas de tareas y subtareas (`due`)

`due` es una fecha real ISO-8601 sin zona horaria (`2026-10-10T23:59`). Sin fecha, la respuesta trae `null`.

- En peticiones: `null`/ausente no cambia la fecha al editar, texto vacío la quita y cualquier otro formato responde `400` (`La fecha debe tener el formato AAAA-MM-DDTHH:mm`).
- `GET /api/tasks` ordena por `due` ascendente; las tareas sin fecha van al final.
- Al arrancar, una migración única convierte las fechas guardadas como texto (`"Sin fecha"`, `"Hoy"`) a `null` y las ISO a fechas reales.
