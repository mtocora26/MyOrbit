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

## Resumen académico (`GET /api/academic/summary`)

Reúne las materias del usuario con su estado de notas, el promedio ponderado por créditos y las materias en riesgo.

| Parámetro | Tipo | Descripción |
|---|---|---|
| `semester` | string, opcional | Filtra por semestre (`2026-1`). Sin él incluye todas las materias. |
| `target` | número, opcional | Meta (0–5). Misma precedencia que el resumen por materia: parámetro, perfil, 3.0. |

```json
{ "weightedAverage": 3.67, "totalCredits": 9, "gradedCredits": 6, "targetGrade": 3.0,
  "subjects": [ { "subjectId": "6f1c…", "name": "Redes", "credits": 4, "semester": "2026-1", "atRisk": false, "grades": { "…": "…" } } ],
  "atRisk": [] }
```

- `weightedAverage`: promedio de `currentGrade` ponderado por créditos, solo con materias que ya tienen notas; `null` si ninguna.
- `grades`: mismo objeto que el resumen por materia.
- Una materia está en riesgo (`atRisk`) si su meta no es alcanzable o necesita más de 4.0 de promedio en lo que falta.

Errores: `400` si `target` está fuera de 0–5, `401` sin sesión.

## Fechas de tareas y subtareas (`due`)

`due` es una fecha real ISO-8601 sin zona horaria (`2026-10-10T23:59`). Sin fecha, la respuesta trae `null`.

- En peticiones: `null`/ausente no cambia la fecha al editar, texto vacío la quita y cualquier otro formato responde `400` (`La fecha debe tener el formato AAAA-MM-DDTHH:mm`).
- `GET /api/tasks` ordena por `due` ascendente; las tareas sin fecha van al final.
- Al arrancar, una migración única convierte las fechas guardadas como texto (`"Sin fecha"`, `"Hoy"`) a `null` y las ISO a fechas reales.

## Cuenta (`/api/auth/me`)

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| `GET` | `/api/auth/me` | | `200` cuenta actual · `401` |
| `PUT` | `/api/auth/me/name` | `{ name }` | `200` cuenta con nuevo nombre · `400` nombre en blanco o >100 caracteres · `401` |
| `PUT` | `/api/auth/me/password` | `{ currentPassword, newPassword }` | `204` · `400` nueva contraseña <8 caracteres · `401` actual incorrecta |

- `newPassword` se cifra con BCrypt. Al cambiarla se cierran todas las sesiones del usuario **excepto la actual** (sigue activa).
- Errores en español con `ProblemDetail`.

## Filtros de tareas (`GET /api/tasks`)

`GET /api/tasks` acepta los filtros combinables (todos opcionales, se aplican en conjunto):

| Parámetro | Tipo | Regla |
|---|---|---|
| `done` | boolean | `true` solo completadas, `false` solo pendientes |
| `dueFrom` / `dueTo` | ISO-8601 `AAAA-MM-DDTHH:mm` | Rango inclusivo sobre `due`; las tareas sin fecha se excluyen si hay algún límite. `dueFrom` posterior a `dueTo` → `400` |
| `priority` | `alta` \| `media` \| `baja` | Otro valor → `400` |
| `categoryId` | id de categoría | Filtra por esa categoría (las tareas sin categoría no coinciden) |
| `uncategorized` | boolean (`true`) | Solo tareas sin categoría; se ignora si se pasa `categoryId` |

Ejemplo: `GET /api/tasks?done=false&priority=alta&categoryId=abc&dueFrom=2026-10-01T00:00&dueTo=2026-10-31T23:59`

## Categoría de tareas (`categoryId`)

La tarea referencia su categoría; ya no existe el campo libre `tag`.

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| `POST` | `/api/tasks` | `{ title, due?, priority?, categoryId? }` | `201` tarea con `categoryId` (`null` si viene ausente o en blanco) |
| `PUT` | `/api/tasks/{id}` | `{ title?, due?, priority?, categoryId? }` | `200` · `404` tarea o categoría no encontrada |
| `GET` | `/api/tasks` | | `200` lista con `categoryId` en cada tarea |

- `categoryId` debe ser el `id` de una categoría del usuario de la sesión; si no existe o es de otro usuario responde `404` (`Categoría no encontrada`).
- Al editar: `categoryId` ausente/null no cambia la categoría, cadena vacía la quita (`null`) y un valor válido la reemplaza.
- Al arrancar, una migración única convierte cada `tag` legado en su `categoryId` (reutilizando la categoría con ese nombre para el usuario o creándola) y elimina el campo `tag`.
