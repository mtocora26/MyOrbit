# MyOrbit - API

Todas las rutas requieren la cabecera `Authorization: Bearer <token>` de la sesión (`/api/auth/login`).
Los errores responden `ProblemDetail` (RFC 9457) con el mensaje en `detail`.

La lista de rutas de todos los módulos está en el [README](../README.md); la referencia completa llegará con OpenAPI (#31).

## Semestres (`/api/semesters`)

Cada semestre pertenece al usuario de la sesión; los de otro usuario responden 404. Las materias se enlazan al semestre
**por nombre** (`Subject.semester`), así que la API de materias no cambia. Al crear o editar una materia, si el usuario aún
no tiene ese semestre se crea solo (sin fechas). Al arrancar, una migración idempotente hace lo mismo con las materias existentes.

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| `GET` | `/api/semesters` | | `200` lista ordenada por nombre (más reciente primero) |
| `POST` | `/api/semesters` | `SemesterRequest` | `201` semestre creado · `400` |
| `PUT` | `/api/semesters/{id}` | `SemesterRequest` | `200` semestre actualizado · `400` · `404` |
| `DELETE` | `/api/semesters/{id}` | | `204` · `400` si tiene materias · `404` |

### `SemesterRequest`

| Campo | Tipo | Regla |
|---|---|---|
| `name` | string | Obligatorio, formato `AAAA-1` o `AAAA-2`. Único por usuario. Si cambia, las materias del semestre se mueven al nuevo nombre. |
| `startDate` | fecha `AAAA-MM-DD` | Opcional. |
| `endDate` | fecha `AAAA-MM-DD` | Opcional; no puede ser anterior a `startDate`. |
| `targetAverage` | número | Opcional, entre 0 y 5. **Meta de promedio del semestre**. El `PUT` reemplaza: omitirla la quita. |

```json
{ "name": "2026-1", "startDate": "2026-02-01", "endDate": "2026-06-15" }
```

### Respuesta

```json
{ "id": "b3e0…", "name": "2026-1", "startDate": "2026-02-01", "endDate": "2026-06-15", "current": true, "missingDates": false, "targetAverage": 4.0 }
```

`current` es `true` si hoy, en la zona horaria del usuario (#130), cae entre `startDate` y `endDate` (ambos incluidos).
`missingDates` es `true` si falta el inicio o el fin; la app avisa para que el usuario los complete.

### Errores

| Caso | HTTP | `detail` |
|---|---|---|
| Nombre con formato inválido | 400 | `El semestre debe tener el formato AAAA-1 o AAAA-2` |
| Nombre repetido | 400 | `Ya tienes el semestre 2026-1` |
| Fin anterior al inicio | 400 | `La fecha de fin no puede ser anterior a la de inicio` |
| Borrar un semestre con materias | 400 | `El semestre 2026-1 tiene materias; elimínalas o muévelas antes de borrarlo` |
| Sin sesión | 401 | |
| Semestre inexistente o de otro usuario | 404 | `Semestre no encontrado` |

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
| `targetGrade` | número | Opcional, entre 0 y 5. **Meta** de la materia. Si falta, aplica la del parámetro, el semestre o el Perfil (ver «Resumen de notas»). |
| `passingGrade` | número | Opcional, entre 0 y 5. **Nota mínima para aprobar**, distinta de la meta. Si falta, 3.0. Si ambas vienen, la meta no puede ser menor (`400`). El `PUT` reemplaza: omitirlas las quita. |
| `schedule` | lista | Opcional (máximo 14). Horario semanal: franjas `{ dayOfWeek, start, end, room }`. Ver «Horario de la materia». El `PUT` reemplaza: omitirla quita el horario. |
| `defaultCuts` | booleano | Opcional (por defecto `false`). Solo al crear: genera los cortes «Corte 1», «Corte 2» y «Corte 3» con 30 / 30 / 40 %, sin nota; después se editan como cualquier evaluación. |

```json
{ "name": "Análisis Numérico", "credits": 3, "semester": "2026-1", "color": "#7A5AF8" }
```

### Respuesta

```json
{ "id": "6f1c…", "name": "Análisis Numérico", "credits": 3, "semester": "2026-1", "color": "#7A5AF8", "targetGrade": 4.5, "passingGrade": 3.0,
  "schedule": [ { "dayOfWeek": 1, "start": "08:00", "end": "10:00", "room": "Aula 301" } ] }
```

`targetGrade` y `passingGrade` son los guardados en la materia; `null` = se usan los por defecto.

### Horario de la materia

Cada franja se repite **cada semana mientras dura el semestre** de la materia (fechas de `/api/semesters`); fuera de esas fechas no hay clase. Con el semestre sin fechas la franja se guarda igual, pero no se puede saber cuándo empieza ni termina.

| Campo | Tipo | Regla |
|---|---|---|
| `dayOfWeek` | entero | Obligatorio, `1` (lunes) a `7` (domingo). |
| `start` / `end` | texto `HH:mm` | Obligatorios, formato de 24 h. `end` debe ser posterior a `start`. |
| `room` | string | Opcional, máximo 50 caracteres. |

- Las franjas de una misma materia no pueden **solaparse** (mismo día y horas que se cruzan); que una termine justo cuando empieza otra sí es válido. Franjas de materias distintas sí pueden coincidir.
- Las horas son «de pared» sin zona: `08:00` es las 8 de la mañana para el usuario, sea cual sea la zona del servidor.

```json
{ "dayOfWeek": 1, "start": "08:00", "end": "10:00", "room": "Aula 301" }
```

### Errores

| Caso | HTTP | `detail` |
|---|---|---|
| Campo inválido | 400 | Mensaje de validación del campo |
| Franjas que se solapan | 400 | `Las franjas se solapan: lunes 08:00-10:00 y lunes 09:00-11:00` |
| Hora de fin no posterior al inicio | 400 | `La hora de fin debe ser posterior a la de inicio` |
| Nombre repetido en el semestre | 400 | `Ya tienes una materia con ese nombre en el semestre 2026-1` |
| Sin sesión | 401 | |
| Materia inexistente o de otro usuario | 404 | `Materia no encontrada` |

## Evaluaciones (`/api/subjects/{subjectId}/evaluations`)

Una evaluación es un **corte** de la materia. Un corte tiene nota directa o se divide en **componentes** (p. ej. «Parcial» 70 % y «Actividades» 30 %) con peso sobre el corte. Cada evaluación pertenece a una materia del usuario de la sesión. Si la materia o la evaluación no son del usuario, responden 404. Al eliminar una materia se eliminan sus evaluaciones.

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
| `components` | lista | Opcional (máximo 20). Componentes del corte: `{ name, percentage, grade }`. Ver abajo. Ausente o vacía = el corte usa `grade` directa (el `PUT` reemplaza, así que omitirla quita los componentes). |
| `due` | texto ISO | Opcional: fecha y hora de la evaluación (`2026-11-20T08:00`). Ausente, `null` o vacío = sin fecha (el `PUT` reemplaza, así que omitirla la quita). Otro formato responde `400` (`La fecha debe tener el formato AAAA-MM-DDTHH:mm`). |

```json
{ "name": "Parcial 1", "percentage": 30, "grade": 4.5, "due": "2026-11-20T08:00" }
```

### Componentes de un corte

| Campo | Tipo | Regla |
|---|---|---|
| `name` | string | Obligatorio, máximo 100 caracteres. |
| `percentage` | número | Obligatorio, mayor que 0 y máximo 100. Es **sobre el corte**; los de un corte no pueden sumar más de 100. |
| `grade` | número | Opcional, entre 0 y 5. |

Un corte con componentes **no lleva `grade` directa** (la nota sale de ellos; enviar ambas responde `400`).

```json
{ "name": "Corte 1", "percentage": 30, "components": [
  { "name": "Parcial", "percentage": 70, "grade": 4.0 },
  { "name": "Actividades", "percentage": 30, "grade": 3.0 } ] }
```

### Respuesta

```json
{ "id": "a91d…", "subjectId": "6f1c…", "name": "Parcial 1", "percentage": 30.0, "grade": 4.5, "due": "2026-11-20T08:00:00",
  "provisionalGrade": 4.5, "complete": true, "components": [] }
```

- `grade`: nota **definitiva** del corte. Directa, o el promedio ponderado de sus componentes **solo cuando el corte está completo** (todos con nota y sumando 100 %); si no, `null`.
- `provisionalGrade`: promedio de los componentes ya calificados (normalizado por su peso), aunque falten otros; igual a `grade` en un corte sin componentes.
- `complete`: el corte cuenta como calificado.
- El resumen de notas (nota actual y necesaria) trata un corte incompleto como **pendiente**: no usa su nota provisional.

### Errores

| Caso | HTTP | `detail` |
|---|---|---|
| Campo inválido | 400 | Mensaje de validación del campo |
| La suma supera 100% | 400 | `La suma de porcentajes no puede superar 100%. Disponible: 10%` |
| Sin sesión | 401 | |
| Materia inexistente o de otro usuario | 404 | `Materia no encontrada` |
| Evaluación inexistente | 404 | `Evaluacion no encontrada` |

## Resumen de notas (`GET /api/subjects/{subjectId}/evaluations/summary`)

Calcula la nota actual y la nota que se necesita en lo que falta, contra la **meta** y contra la **nota mínima para aprobar** (estrategia `WeightedGradeStrategy`, escala 0–5). Son dos cifras distintas: se puede aprobar sin llegar a la meta.

| Parámetro | Tipo | Descripción |
|---|---|---|
| `target` | número, opcional | Meta (0–5). Precedencia: este parámetro, la `targetGrade` de la materia, `gradeTarget` del perfil y, si no es válido, 3.0. La nota para aprobar es la `passingGrade` de la materia o 3.0. |

```json
{ "currentGrade": 3.6, "accumulatedPoints": 1.8, "gradedPercentage": 50.0, "remainingPercentage": 50.0,
  "targetGrade": 3.5, "requiredGrade": 3.4, "achievable": true,
  "passingGrade": 3.0, "requiredToPass": 2.6, "canPass": true }
```

| Campo | Significado |
|---|---|
| `currentGrade` | Promedio ponderado de lo ya calificado; `null` si no hay notas. |
| `accumulatedPoints` | Puntos ganados sobre la nota final (nota × porcentaje / 100). |
| `gradedPercentage` / `remainingPercentage` | Porcentaje calificado y por calificar (lo no planeado cuenta como pendiente). |
| `requiredGrade` | Promedio necesario en el porcentaje pendiente para llegar a la meta (0 si ya se alcanzó); `null` si no queda nada por calificar. |
| `achievable` | `false` si la nota necesaria supera 5 o, con todo calificado, no se llegó a la meta. |
| `passingGrade` | Nota mínima para aprobar que se aplicó. |
| `requiredToPass` | Igual que `requiredGrade`, pero para aprobar. |
| `canPass` | Igual que `achievable`, pero para aprobar: `false` si ya no alcanza para aprobar. |

Errores: `400` si `target` está fuera de 0–5, `401` sin sesión, `404` si la materia no existe o es de otro usuario.

## Clases (`/api/academic/classes`)

Convierte el horario semanal de las materias (ver «Horario de la materia») en clases concretas por fecha.

- Una franja se repite cada semana **solo mientras dura el semestre** de su materia (fechas de `/api/semesters`, inicio y fin incluidos). **Si el semestre no tiene fechas (o no existe), esa materia no genera clases**: sin ellas no se sabe cuándo empieza ni termina.
- Cada materia sigue su propio semestre; las franjas de materias distintas pueden coincidir.

| Método | Ruta | Parámetros | Respuesta |
|---|---|---|---|
| `GET` | `/api/academic/classes` | `from`, `to` (`AAAA-MM-DD`, obligatorios, ambos incluidos) | `200` lista por fecha y hora de inicio · `400` si falta alguno, `from` > `to` o el rango supera 62 días |
| `GET` | `/api/academic/classes/now` | | `200` `{ current, next }` |

```json
{ "subjectId": "6f1c…", "subjectName": "Redes", "subjectColor": "#2E90FA", "date": "2026-03-02",
  "start": "08:00", "end": "10:00", "room": "Aula 301",
  "startsAt": "2026-03-02T08:00:00", "endsAt": "2026-03-02T10:00:00" }
```

`/now` usa la **hora local del usuario** (su zona horaria, #130), no la del servidor:
- `current`: la clase en la que está ahora (`startsAt` ≤ ahora < `endsAt`; el fin es exclusivo, así que a las 10:00 ya no está en la de 8:00–10:00); `null` si no está en clase.
- `next`: la primera clase que empieza después de ahora, buscando hasta 14 días adelante; `null` si no hay (por ejemplo, terminó el semestre).

## Resumen académico (`GET /api/academic/summary`)

Reúne las materias del usuario con su estado de notas, el promedio ponderado por créditos y las materias en riesgo.

| Parámetro | Tipo | Descripción |
|---|---|---|
| `semester` | string, opcional | Filtra por semestre (`2026-1`). Sin él incluye todas las materias. |
| `target` | número, opcional | Meta (0–5). Precedencia: parámetro, `targetAverage` del semestre (si se filtra por uno que la tiene), perfil, 3.0. Cada materia usa su propia `targetGrade` si la tiene. |

```json
{ "weightedAverage": 3.67, "totalCredits": 9, "gradedCredits": 6, "targetGrade": 3.0,
  "subjects": [ { "subjectId": "6f1c…", "name": "Redes", "credits": 4, "semester": "2026-1", "atRisk": false, "grades": { "…": "…" } } ],
  "atRisk": [] }
```

- `weightedAverage`: promedio de `currentGrade` ponderado por créditos, solo con materias que ya tienen notas; `null` si ninguna.
- `grades`: mismo objeto que el resumen por materia.
- `targetGrade`: la meta del resumen (la del semestre, o la del perfil o 3.0).
- Una materia está en riesgo (`atRisk`) si ya no puede **aprobar** (`canPass` falso) o necesita más de 4.0 de promedio en lo que falta para aprobar. Perder la meta, sin dejar de aprobar, no es riesgo.

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

## Editar y eliminar categorías (`/api/categories/{id}`)

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| `PUT` | `/api/categories/{id}` | `{ name, color?, parentId? }` | `200` categoría actualizada · `400` nombre vacío/largo (máx. 50), nombre repetido, color no hexadecimal o jerarquía inválida · `404` no existe o es de otro usuario |
| `DELETE` | `/api/categories/{id}` | | `204` · `404` no existe o es de otro usuario |

- `name` es obligatorio y no puede repetirse (sin distinguir mayúsculas) entre sus **hermanas** (las que tienen el mismo padre; ver «Subcategorías»); conservar el nombre propio sí está permitido.
- `color` ausente conserva el color actual; si viene debe ser `#RRGGBB`.
- **Tareas asociadas:** al eliminar una categoría sus tareas **no se borran ni se bloquea la operación**; quedan sin categoría (`categoryId: null`) y pasan a aparecer con `GET /api/tasks?uncategorized=true`. El módulo de categorías publica un `CategoryDeletedEvent` y el de tareas lo escucha, así no hay dependencia circular entre módulos.

## Subcategorías (`parentId`)

Una categoría puede tener **un nivel** de subcategorías («Universidad › Semillero»). `GET /api/categories` devuelve todas en una lista plana; cada una trae `parentId` (`null` si es raíz).

| Método | Ruta | Body | Notas |
|---|---|---|---|
| `POST` | `/api/categories` | `{ name, color?, parentId? }` | Con `parentId` crea una subcategoría de esa categoría. Sin `color`, hereda el de su padre. |
| `PUT` | `/api/categories/{id}` | `{ name, color?, parentId? }` | `parentId` **ausente/null no cambia el padre**, cadena vacía la convierte en raíz y un id la mueve bajo esa categoría (mismo criterio que `categoryId` en las tareas). |

Reglas (`400` si se incumplen, `404` si el padre no existe o es de otro usuario):

- El padre debe ser una **categoría raíz**: no hay subcategorías de subcategorías.
- Una categoría no puede ser su propio padre, ni una categoría **con subcategorías** pasar a ser subcategoría (serían tres niveles).
- El nombre es único **entre hermanas** (sin distinguir mayúsculas): se puede repetir bajo otro padre, y una subcategoría puede llamarse igual que una raíz. Las raíces siguen siendo únicas entre sí.

**Al eliminar una categoría con subcategorías**, estas **no se borran ni se bloquea la operación**: pasan a ser categorías raíz. Si su nombre choca con otra raíz se renombran «Padre › Hija» (con « (2)», « (3)»… si aún choca; máximo 50 caracteres). Las tareas de la categoría eliminada quedan sin categoría, como antes; **las de sus subcategorías se conservan** en ellas.

**Filtrar tareas** con `GET /api/tasks?categoryId=<id>` por una categoría raíz devuelve también las tareas de sus subcategorías; por una subcategoría, solo las suyas.

## Editar hábitos (`PUT /api/habits/{id}`)

Body: `{ title, frequency?, daysOfWeek?, color?, icon? }`

| Respuesta | Cuándo |
|---|---|
| `200` | hábito actualizado (misma forma que `GET /api/habits`) |
| `400` | `title` vacío o > 100 caracteres, `frequency` distinta de `diaria`/`personalizada`, `color` no `#RRGGBB` |
| `404` | el hábito no existe o es de otro usuario |

- `title` es obligatorio. `frequency`, `color` e `icon` ausentes conservan el valor actual.
- `daysOfWeek` (1 = lunes … 7 = domingo) solo aplica a `personalizada`: se descartan valores fuera de rango y duplicados; si queda vacío o la frecuencia es `diaria`, se usa toda la semana. Si se omite en un hábito personalizado se conservan los días actuales.
- El historial `completedDates` **no cambia** al editar.

## Marcar hábito (`PATCH /api/habits/{id}/completion`)

Body: `{ completed, date? }`. `date` es opcional (por defecto, hoy según el reloj del servidor) y, si viene, debe tener formato ISO `AAAA-MM-DD` y ser una fecha real del calendario. Cualquier otro valor (`hoy`, `10/10/2026`, `2026-02-30`, con hora…) responde `400` y no modifica el hábito. Aplica tanto al marcar como al desmarcar.

## Notificaciones (`/api/notifications`)

Las notificaciones las genera el sistema a partir de eventos (tarea con fecha creada → `DEADLINE`, tarea completada → `EVENT`, hábito pendiente → `HABIT`); el usuario solo las consulta y las marca como leídas. Cada usuario ve únicamente las suyas.

| Método | Ruta | Respuesta |
|---|---|---|
| `GET` | `/api/notifications?unread=true` | `200` lista, más recientes primero. `unread=true` devuelve solo las no leídas (por defecto, todas). |
| `GET` | `/api/notifications/unread-count` | `200` `{ "count": 3 }` |
| `PATCH` | `/api/notifications/{id}/read` | `200` notificación con `read: true` (idempotente) · `404` no existe o es de otro usuario |
| `PATCH` | `/api/notifications/read-all` | `200` `{ "updated": 2 }` (cuántas pasaron a leídas) |

Notificación: `{ id, type: "DEADLINE"|"EVENT"|"HABIT", title, message, referenceId, createdAt (ISO-8601 UTC), read }`. `referenceId` es el id de la tarea u hábito de origen.

## Rachas y estadísticas (`GET /api/habits/{id}/stats?days=30`)

`days` es la ventana en días terminando hoy (1–365, por defecto 30); fuera de rango responde `400`. `404` si el hábito no existe o es de otro usuario.

```json
{ "currentStreak": 3, "bestStreak": 10, "completionRate": 83.3, "scheduledDays": 30, "completedDays": 25, "windowDays": 30 }
```

| Campo | Significado |
|---|---|
| `currentStreak` | Días programados consecutivos cumplidos hasta hoy. Si hoy está programado y aún sin marcar, **no** rompe la racha (se cuenta desde ayer). |
| `bestStreak` | La racha más larga de todo el historial. |
| `completionRate` | % (0–100, un decimal) de días programados cumplidos dentro de la ventana. |
| `scheduledDays` / `completedDays` | Base del porcentaje: días programados de la ventana y cuántos se cumplieron. |
| `windowDays` | La ventana pedida. |

Reglas:
- Solo cuentan los **días programados**: en un hábito `personalizada`, un día no programado ni rompe ni suma a la racha, y un cumplimiento marcado en un día no programado se ignora.
- Hoy cuenta en `scheduledDays` solo si ya está cumplido (no penaliza el día en curso).
- La ventana no se extiende antes del día de creación del hábito (`createdDate`, que se guarda al crearlo), para no penalizar un hábito nuevo; los hábitos anteriores a este cambio no tienen ese dato y usan la ventana completa.
- Las fechas guardadas que no sean ISO (datos previos a #38) se ignoran.

## Preferencias de notificaciones (`/api/notifications/preferences`)

Cada usuario elige qué tipos de aviso quiere recibir. Sin haber guardado nada, todos están activados.

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| `GET` | `/api/notifications/preferences` | | `200` `{ "deadline": true, "event": true, "habit": true }` |
| `PUT` | `/api/notifications/preferences` | `{ deadline, event, habit }` (los tres obligatorios) | `200` las preferencias guardadas · `400` si falta algún campo · `401` sin sesión |

| Campo | Controla | Tipo de notificación |
|---|---|---|
| `deadline` | Aviso al crear una tarea con fecha y recordatorio 24 h antes del vencimiento | `DEADLINE` |
| `event` | Aviso al completar una tarea | `EVENT` |
| `habit` | Recordatorio diario de hábitos pendientes | `HABIT` |

- Un tipo desactivado **no se genera**: `NotificationService` lo descarta tanto para avisos inmediatos como para los recordatorios programados, sin afectar a los demás tipos ni a otros usuarios. Las notificaciones ya creadas se conservan.
- No existe un interruptor «push»: hoy los avisos viven solo dentro de la app. Web Push (PWA) sería un cambio aparte.

## Perfil académico (`/api/profile`)

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| `GET` | `/api/profile` | | `200` `{ userId, program, semester, gradeTarget }` · `204` si aún no se configuró |
| `PUT` | `/api/profile` | `{ program, semester, gradeTarget }` | `200` el perfil guardado |

- `gradeTarget` es la meta de promedio por defecto de los resúmenes de notas.
- El **código estudiantil se eliminó** del perfil (#128): un cliente antiguo que lo envíe es ignorado, y el dato guardado desaparece la próxima vez que se guarde el perfil.


## Evaluaciones con fecha para la Agenda (`GET /api/academic/evaluations`)

Evaluaciones de **todas** las materias del usuario que tienen fecha, de la más próxima a la más lejana, cada una con su materia. Las que no tienen fecha no aparecen.

| Parámetro | Tipo | Descripción |
|---|---|---|
| `dueFrom` | `AAAA-MM-DDTHH:mm`, opcional | Incluye desde esa fecha. |
| `dueTo` | `AAAA-MM-DDTHH:mm`, opcional | Incluye hasta esa fecha. |

`400` si `dueFrom` es posterior a `dueTo`; `401` sin sesión.

```json
[ { "id": "a91d…", "subjectId": "6f1c…", "subjectName": "Redes", "subjectColor": "#2E90FA",
    "name": "Parcial 2", "percentage": 30.0, "grade": null, "due": "2026-11-20T08:00:00" } ]
```


## Zona horaria de la cuenta (`PUT /api/auth/me/timezone`)

Los recordatorios, el «hoy» de los hábitos y el día en que se agrupan los avisos se calculan con la zona horaria de cada usuario, no con la del servidor (en la nube suele ser UTC).

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| `PUT` | `/api/auth/me/timezone` | `{ "timeZone": "America/Bogota" }` | `200` la cuenta con `timeZone` · `400` si es vacía o no es una zona válida · `401` sin sesión |
| `GET` | `/api/auth/me` | | incluye `timeZone` (`null` si aún no se fijó) |

- Se aceptan zonas con nombre de región (`America/Bogota`, `Europe/Madrid`) y `UTC`; no desplazamientos (`+05:00`) ni `Etc/GMT+5`.
- Una cuenta sin zona usa **America/Bogota**. El frontend guarda automáticamente la zona del dispositivo la primera vez que se abre la app, y se puede cambiar en el Perfil.
- Las fechas de tareas y evaluaciones (`due`) son hora local sin zona: se interpretan en la zona del usuario.
