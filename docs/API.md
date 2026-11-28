# MyOrbit - API

Todas las rutas requieren la cabecera `Authorization: Bearer <token>` de la sesión (`/api/auth/login`).
Los errores responden `ProblemDetail` (RFC 9457) con el mensaje en `detail`.

La lista de rutas de todos los módulos está en el [README](../README.md); la referencia interactiva generada del código (springdoc-openapi) está en `/swagger-ui.html` y el contrato en `/v3/api-docs`. Las secciones de abajo añaden las reglas de negocio.

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

## Eventos (`/api/events`)

Un evento es una actividad de **uno o varios días** («semana de parciales», «feria de empleo»): título, rango de fechas y hora opcional. Es distinto de una **clase** (se repite cada semana) y de una **tarea** (tiene una fecha límite). Cada evento pertenece al usuario de la sesión; los de otro usuario responden `404`.

| Método | Ruta | Cuerpo / parámetros | Respuesta |
|---|---|---|---|
| `GET` | `/api/events` | `from`, `to` (`AAAA-MM-DD`, opcionales, incluidos) | `200` lista · `400` si `from` > `to` o una fecha no es válida |
| `GET` | `/api/events/{id}` | | `200` evento · `404` |
| `POST` | `/api/events` | `CalendarEventRequest` | `201` evento creado · `400` · `404` materia o categoría |
| `PUT` | `/api/events/{id}` | `CalendarEventRequest` | `200` evento actualizado · `400` · `404` |
| `DELETE` | `/api/events/{id}` | | `204` · `404` |

`GET` con `from`/`to` devuelve los eventos que **ocupan al menos un día** dentro del rango: un evento de varios días aparece en cualquier semana que toque, no solo en la de su inicio. Van ordenados por fecha de inicio y hora; los que no tienen hora van primero («todo el día»).

### `CalendarEventRequest`

| Campo | Tipo | Regla |
|---|---|---|
| `title` | string | Obligatorio, máximo 200 caracteres. |
| `startDate` | fecha `AAAA-MM-DD` | Obligatoria. |
| `endDate` | fecha `AAAA-MM-DD` | Opcional: último día (incluido). Ausente = un solo día. No puede ser anterior a `startDate`; el evento dura como máximo 366 días. |
| `startTime` | texto `HH:mm` | Opcional (24 h): la hora del **primer día**. |
| `endTime` | texto `HH:mm` | Opcional y solo con `startTime`: la hora del **último día**. En un evento de un solo día debe ser posterior a `startTime`; en uno de varios días son de días distintos y no se compara. |
| `subjectId` | id de materia | Opcional: debe ser una materia del usuario (`404` si no existe o es de otro). |
| `categoryId` | id de categoría | Opcional: debe ser una categoría del usuario (`404` si no). |

El `PUT` **reemplaza todo**: un campo opcional ausente lo quita (a diferencia de las tareas, donde ausente no cambia). Las horas son «de pared» sin zona, como las del horario.

```json
{ "title": "Semana de parciales", "startDate": "2026-03-02", "endDate": "2026-03-06", "startTime": null, "endTime": null,
  "subjectId": null, "categoryId": "uni" }
```

### Respuesta

```json
{ "id": "b7e0…", "title": "Semana de parciales", "startDate": "2026-03-02", "endDate": "2026-03-06",
  "startTime": null, "endTime": null, "subjectId": null, "categoryId": "uni", "multiDay": true }
```

`multiDay`: dura más de un día. Si no hay fin, `endDate` coincide con `startDate`.

### Errores

| Caso | HTTP | `detail` |
|---|---|---|
| Título o fecha de inicio ausentes, hora con formato inválido | 400 | Mensaje de validación del campo |
| Fin anterior al inicio | 400 | `La fecha de fin no puede ser anterior a la de inicio` |
| Más de 366 días | 400 | `Un evento no puede durar mas de 366 dias` |
| Hora de fin sin inicio | 400 | `La hora de fin requiere una hora de inicio` |
| Hora de fin no posterior (un solo día) | 400 | `La hora de fin debe ser posterior a la de inicio` |
| Sin sesión | 401 | |
| Evento inexistente o de otro usuario | 404 | `Evento no encontrado` |
| Materia o categoría inexistente o de otro usuario | 404 | `Materia no encontrada` / `Categoría no encontrada` |

**Al eliminar la materia o la categoría** asociada, los eventos **no se borran**: solo pierden esa asociación (`subjectId`/`categoryId` pasan a `null`). El módulo de eventos escucha `SubjectDeletedEvent` y `CategoryDeletedEvent`.

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

## Respuestas agrupadas para pantallas móviles

Dos `GET` de solo lectura que reúnen lo que una pantalla pide junta, para no hacer varias peticiones. Los endpoints individuales siguen igual.

| Ruta | Respuesta |
|---|---|
| `GET /api/academic/overview` | `{ "subjects": [...], "semesters": [...] }`: lo mismo que `GET /api/subjects` y `GET /api/semesters`. |
| `GET /api/subjects/{subjectId}/evaluations/overview?target=` | `{ "evaluations": [...], "summary": {...} }`: lo mismo que `GET .../evaluations` y `GET .../evaluations/summary`. `404` si la materia no es del usuario. |

Ambos: `401` sin sesión.

## Fechas de tareas y subtareas (`due`)

`due` es una fecha real ISO-8601 sin zona horaria (`2026-10-10T23:59`). Sin fecha, la respuesta trae `null`.

- En peticiones: `null`/ausente no cambia la fecha al editar, texto vacío la quita y cualquier otro formato responde `400` (`La fecha debe tener el formato AAAA-MM-DDTHH:mm`).
- `GET /api/tasks` ordena por `due` ascendente; las tareas sin fecha van al final.
- Al arrancar, una migración única convierte las fechas guardadas como texto (`"Sin fecha"`, `"Hoy"`) a `null` y las ISO a fechas reales.

## Cuenta (`/api/auth/me`)

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| `GET` | `/api/auth/me` | | `200` cuenta actual · `401` |
| `POST` | `/api/auth/me/terms` | `{ acceptedTermsVersion, ageDeclaration }` | `200` cuenta · `400` falta un dato o la versión no es la vigente · `401` |
| `PUT` | `/api/auth/me/name` | `{ name }` | `200` cuenta con nuevo nombre · `400` nombre en blanco o >100 caracteres · `401` |
| `PUT` | `/api/auth/me/password` | `{ currentPassword, newPassword }` | `204` · `400` nueva contraseña <8 caracteres · `401` actual incorrecta |

- `newPassword` se cifra con BCrypt. Al cambiarla se cierran todas las sesiones del usuario **excepto la actual** (sigue activa).
- Errores en español con `ProblemDetail`.

## Registro y aceptación de términos

`POST /api/auth/register` recibe `{ name, email, password, acceptedTermsVersion, ageDeclaration }`. Los dos últimos son obligatorios (**cambio incompatible**: una app anterior no puede crear cuentas).

- `acceptedTermsVersion`: la versión que se mostró; debe ser la vigente (`1.0`), si no `400`.
- `ageDeclaration`: `ADULT` o `MINOR_AUTHORIZED` (menor con autorización de su representante legal). Es una declaración que no se verifica; no se pide fecha de nacimiento.

Se guardan la versión, la fecha y la declaración. Toda respuesta de cuenta incluye `termsPending`: `true` en cuentas anteriores, en las creadas por un administrador y cuando cambia la versión. La app pide entonces la autorización (`POST /api/auth/me/terms`) antes de dejar usarla; la API no bloquea las demás rutas.

## Eliminar mi cuenta (`DELETE /api/auth/me`)

Cuerpo: `{ "password": "..." }`. Responde `204` y borra la cuenta con todos sus datos (los mismos que en el borrado por administración, abajo). No se puede deshacer.

Errores: `401` sin sesión; `400` si falta la contraseña, si es incorrecta (la sesión sigue abierta) o si es el único administrador activo.

## Eliminar una cuenta (`DELETE /api/admin/users/{id}`)

Solo para administradores; responde `204`. Borra la cuenta y **todos sus datos**: perfil académico, sesiones, tareas, categorías, semestres, materias, evaluaciones, hábitos, eventos, notificaciones y sus preferencias, recordatorios personales y suscripciones push. No se puede deshacer.

La cuenta se borra al final: si falla el borrado de algún dato, la cuenta sigue existiendo (sin sesiones) y se puede repetir la operación.

Errores: `403` sin permisos de administrador, `404` si no existe, `400` al intentar eliminar la propia cuenta o el último administrador activo.

## Filtros de tareas (`GET /api/tasks`)

`GET /api/tasks` acepta los filtros combinables (todos opcionales, se aplican en conjunto):

| Parámetro | Tipo | Regla |
|---|---|---|
| `done` | boolean | `true` solo completadas, `false` solo pendientes |
| `dueFrom` / `dueTo` | ISO-8601 `AAAA-MM-DDTHH:mm` | Rango inclusivo sobre `due`; las tareas sin fecha se excluyen si hay algún límite. `dueFrom` posterior a `dueTo` → `400` |
| `priority` | `alta` \| `media` \| `baja` | Otro valor → `400` |
| `categoryId` | id de categoría | Filtra por esa categoría (las tareas sin categoría no coinciden) |
| `uncategorized` | boolean (`true`) | Solo tareas sin categoría; se ignora si se pasa `categoryId` |

Orden: por `due` ascendente (sin fecha al final). Con `done=true`, por `completedAt` de la más reciente a la más antigua (sin fecha al final).

Cada tarea incluye `completedAt` (instante ISO-8601): cuándo pasó a completada, ya sea al marcarla o al completar su última subtarea; en cambios hechos sin conexión, la hora en que se hicieron. Es `null` si está pendiente o se completó antes de registrarlo. Reabrirla lo borra. Las tareas completadas no se borran solas.

Ejemplo: `GET /api/tasks?done=false&priority=alta&categoryId=abc&dueFrom=2026-10-01T00:00&dueTo=2026-10-31T23:59`

## Eliminar las completadas (`DELETE /api/tasks/completed`)

Borra todas las tareas completadas del usuario de la sesión, sin importar filtros. Responde `200` con `{ "deleted": 3 }` (`0` si no había) · `401` sin sesión. No se puede deshacer y nunca se ejecuta de forma automática.

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

## Materia de la tarea (`subjectId`)

Una tarea puede vincularse a una materia registrada (campo opcional `subjectId`). Es independiente de la categoría.

| Método | Ruta | Body / parámetro | Notas |
|---|---|---|---|
| `POST` | `/api/tasks` | `{ title, …, subjectId? }` | `201` tarea con `subjectId` (`null` si viene ausente o en blanco) |
| `PUT` | `/api/tasks/{id}` | `{ …, subjectId? }` | `subjectId` **ausente/null no cambia la materia**, cadena vacía quita el vínculo y un id la vincula (mismo criterio que `categoryId`) |
| `GET` | `/api/tasks?subjectId=<id>` | | Solo las tareas de esa materia; se combina con el resto de filtros (p. ej. `done=false` para sus pendientes) |

- `subjectId` debe ser el `id` de una materia del usuario de la sesión; si no existe o es de otro usuario responde `404` (`Materia no encontrada`) y no se guarda nada.
- **Categoría Universidad:** al vincular una materia a una tarea **sin categoría** (al crearla, o al editarla), la tarea queda en la categoría raíz «Universidad» del usuario, si la tiene (no se crea una). Una categoría pedida en la misma petición, o ya asignada, **no se cambia**. Quitar la materia tampoco cambia la categoría.
- **Al eliminar una materia** sus tareas **no se borran ni se bloquea la operación**: solo pierden el vínculo (`subjectId: null`) y conservan su categoría. El módulo académico publica un `SubjectDeletedEvent` y el de tareas lo escucha, como con `CategoryDeletedEvent`.

## Tareas creadas y editadas sin conexión

La app guarda en el teléfono los cambios que el usuario hace sin red y los envía al volver (#216). Para que reenviar no duplique ni pise cambios más nuevos:

| Qué | Cómo |
|---|---|
| `POST /api/tasks` con `id` | `id` opcional (UUID generado por el cliente). Si ya existe una tarea **del mismo usuario** con ese `id`, se devuelve esa tarea (`201`, sin crear otra ni publicar eventos). Si el `id` es de otro usuario: `400`. Un `id` que no es UUID: `400`. |
| `PUT /api/tasks/{id}` y `PATCH /api/tasks/{id}/status` con `clientTime` | `clientTime` opcional (instante ISO-8601): cuándo hizo el usuario el cambio. Si la tarea se modificó **después** de ese momento, responde `409` y no aplica nada; si no, el cambio se aplica y la tarea queda sellada con `clientTime`. Sin `clientTime` el cambio es «de ahora» y siempre se aplica. |
| `updatedAt` en la respuesta | Instante lógico del último cambio (`null` en tareas anteriores a este campo). |

- **Regla de conflicto: gana la última escritura, medida por la hora en que se hizo el cambio**, no por cuándo llegó. Así los cambios hechos sin conexión que llegan en orden no se estorban entre sí, y uno de otro dispositivo que se hizo después no se pierde. El reloj del dispositivo manda: un `clientTime` más de 5 minutos en el futuro se toma como «ahora».
- **Borrar:** `DELETE /api/tasks/{id}` no mira la hora: borrar gana siempre. Si la tarea ya no existe responde `404`; el cliente lo toma como borrado hecho.
- Las subtareas **no** se pueden cambiar sin conexión.

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

Body: `{ title, frequency?, daysOfWeek?, color?, icon?, monthlyGoal?, type? }`

| Respuesta | Cuándo |
|---|---|
| `200` | hábito actualizado (misma forma que `GET /api/habits`) |
| `400` | `title` vacío o > 100 caracteres, `frequency` distinta de `diaria`/`personalizada`, `color` no `#RRGGBB`, `monthlyGoal` fuera de 0–100, `type` distinto de `BUILD`/`QUIT` |
| `404` | el hábito no existe o es de otro usuario |

- `title` es obligatorio. `frequency`, `color`, `icon`, `monthlyGoal` y `type` ausentes conservan el valor actual.
- `monthlyGoal` (entero 1–100) fija la meta de cumplimiento mensual; **`0` la quita** (ver «Meta mensual» abajo).
- `daysOfWeek` (1 = lunes … 7 = domingo) solo aplica a `personalizada`: se descartan valores fuera de rango y duplicados; si queda vacío o la frecuencia es `diaria`, se usa toda la semana. Si se omite en un hábito personalizado se conservan los días actuales.
- El historial `completedDates` **no cambia** al editar.

## Hábitos para dejar (`type`)

Un hábito tiene un `type` (también en `POST /api/habits`, por defecto `BUILD`, y en la respuesta de `GET /api/habits`):

| `type` | Significa | Marcar el día quiere decir |
|---|---|---|
| `BUILD` | Hábito por construir (leer, ejercicio) | «lo hice» |
| `QUIT` | Hábito para dejar (no fumar, menos redes) | «hoy lo evité» |

Es el mismo motor: rachas, estadísticas, `PATCH .../completion` y la meta mensual (`monthlyGoal`, p. ej. 90 %) funcionan igual en ambos tipos, y el tipo se puede cambiar al editar. Los hábitos guardados antes de este campo se tratan como `BUILD`.

La diferencia está en el **recordatorio** (`HABIT`): en un `QUIT` el aviso es «Hábito para dejar — ¿Hoy lo evitaste? Marca "No fumar" si lo lograste», en lugar de «Aún no has cumplido el hábito…».

Pendiente de decidir: un botón explícito de recaída que distinga un olvido (día sin marcar) de una recaída; por ahora un día sin marcar cuenta igual que cualquier día no cumplido.

## Meta mensual de un hábito (`GET /api/habits/{id}/monthly-goal?months=6`)

Cada hábito puede tener una meta de cumplimiento mensual, `monthlyGoal` (entero 1–100, opcional, también en `POST /api/habits` y en la respuesta de `GET /api/habits`). El mes se considera **aprobado** si los días cumplidos llegan al `monthlyGoal` % de los días programados del mes **completo**; no se exige el 100 %.

`months` (0–24, por defecto 6) es cuántos meses ya terminados se devuelven en el historial.

```json
{
  "goal": 80,
  "current": { "month": "2026-10", "scheduledDays": 31, "completedDays": 8, "requiredDays": 25, "remainingToGoal": 17,
               "remainingDays": 22, "rate": 25.8, "approved": false, "reachable": true },
  "history": [ { "month": "2026-09", "scheduledDays": 30, "completedDays": 28, "requiredDays": 24, "remainingToGoal": 0,
                 "remainingDays": 0, "rate": 93.3, "approved": true, "reachable": true } ]
}
```

| Campo | Significado |
|---|---|
| `scheduledDays` / `completedDays` | Días programados del mes y cuántos se cumplieron. |
| `requiredDays` | Mínimo para aprobar: ⌈`monthlyGoal` % de `scheduledDays`⌉. |
| `remainingToGoal` | Cumplimientos que faltan para aprobar (0 si ya se llegó). |
| `remainingDays` | Días programados que quedan por cumplir en el mes (hoy cuenta si falta); 0 en meses pasados. |
| `approved` / `reachable` | El mes ya llegó a la meta / aún se puede llegar (lo que falta cabe en los días que quedan). |

| Respuesta | Cuándo |
|---|---|
| `200` | meta, mes en curso e historial (más reciente primero) |
| `400` | el hábito no tiene `monthlyGoal`, o `months` fuera de 0–24 |
| `404` | el hábito no existe o es de otro usuario |

Reglas: solo cuentan los **días programados** (como en las rachas); el primer mes cuenta desde el día de creación del hábito, y el historial no retrocede antes de ese mes ni incluye meses sin días programados. «Hoy» y los límites del mes usan la zona horaria del usuario. El historial se evalúa con la meta **actual** del hábito.

## Marcar hábito (`PATCH /api/habits/{id}/completion`)

Body: `{ completed, date? }`. `date` es opcional (por defecto, hoy según el reloj del servidor) y, si viene, debe tener formato ISO `AAAA-MM-DD` y ser una fecha real del calendario. Cualquier otro valor (`hoy`, `10/10/2026`, `2026-02-30`, con hora…) responde `400` y no modifica el hábito. Aplica tanto al marcar como al desmarcar.

La fecha también debe caer en el rango permitido, para marcar **y** para desmarcar: no puede ser posterior a hoy (según la zona horaria del usuario) ni anterior al día de creación del hábito (los hábitos sin día de creación no tienen límite inferior). Si no, responde `400` y no modifica nada. Marcar o desmarcar un día pasado recalcula racha, estadísticas y meta mensual, porque se calculan siempre a partir de las fechas cumplidas.

## Notificaciones (`/api/notifications`)

Las notificaciones las genera el sistema a partir de eventos (tarea con fecha → `DEADLINE`, hábito pendiente → `HABIT`, tareas vencidas → `OVERDUE`, parcial próximo → `EXAM`, materia en riesgo → `AT_RISK`, clase por empezar o evento que empieza → `CLASS`, recordatorio personal que llegó a su hora → `REMINDER`; el aviso «tarea completada» (`EVENT`) se eliminó en #140); el usuario solo las consulta y las marca como leídas. Cada usuario ve únicamente las suyas.

| Método | Ruta | Respuesta |
|---|---|---|
| `GET` | `/api/notifications?unread=true` | `200` lista, más recientes primero. `unread=true` devuelve solo las no leídas (por defecto, todas). |
| `GET` | `/api/notifications/unread-count` | `200` `{ "count": 3 }` |
| `PATCH` | `/api/notifications/{id}/read` | `200` notificación con `read: true` (idempotente) · `404` no existe o es de otro usuario |
| `PATCH` | `/api/notifications/read-all` | `200` `{ "updated": 2 }` (cuántas pasaron a leídas) |

Notificación: `{ id, type: "DEADLINE"|"HABIT"|"OVERDUE"|"EXAM"|"AT_RISK"|"CLASS"|"REMINDER", title, message, referenceId, createdAt (ISO-8601 UTC), read }`. `referenceId` es el id de la tarea, hábito, evaluación o materia de origen (`"overdue"` en el resumen de vencidas).

## Resumen de hábitos (`GET /api/habits/summary?days=30&months=6`)

Estadísticas y meta mensual de **todos** los hábitos del usuario en una sola petición, para no hacer una por hábito. `days` (1–365, por defecto 30) y `months` (0–24, por defecto 6) siguen las mismas reglas que `/stats` y `/monthly-goal`; fuera de rango responde `400`. `monthlyGoal` es `null` si el hábito no tiene meta.

```json
[
  { "habitId": "h1", "stats": { "currentStreak": 3, "bestStreak": 10, "completionRate": 83.3, "scheduledDays": 30, "completedDays": 25, "windowDays": 30 },
    "monthlyGoal": { "goal": 80, "current": { "month": "2026-10", "...": "..." }, "history": [] } },
  { "habitId": "h2", "stats": { "currentStreak": 0, "bestStreak": 1, "completionRate": 10.0, "scheduledDays": 30, "completedDays": 3, "windowDays": 30 }, "monthlyGoal": null }
]
```

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
| `GET` | `/api/notifications/preferences` | | `200` `{ "deadline": true, "habit": true, "overdue": true, "exam": true, "atRisk": true, "classReminder": true, "reminder": true }` |
| `PUT` | `/api/notifications/preferences` | `{ deadline, habit, overdue, exam, atRisk, classReminder, reminder? }` (los seis primeros obligatorios; `reminder` es opcional y, si no viene, se conserva el valor actual) | `200` las preferencias guardadas · `400` si falta algún campo · `401` sin sesión |

| Campo | Controla | Tipo | Cuándo se envía |
|---|---|---|---|
| `deadline` | Fecha límite de una tarea | `DEADLINE` | Al crearla, **1 día antes** (ventana de 23–24 h) y **1 hora antes**; cada uno una sola vez |
| `habit` | Hábitos de hoy sin cumplir | `HABIT` | Al final del día: 20:00 hora local (`myorbit.reminders.habit-hour`) |
| `overdue` | Resumen «tienes N tareas vencidas» | `OVERDUE` | Cada mañana, 08:00 local (`myorbit.reminders.hour`), solo si hay vencidas |
| `exam` | Evaluación sin calificar con fecha en los próximos 3 días | `EXAM` | Mañana de cada día; un solo aviso por evaluación |
| `atRisk` | Materia del semestre en curso en riesgo de no aprobarse | `AT_RISK` | Mañana; como máximo uno por semana y materia |
| `classReminder` | Clase del horario y evento con hora | `CLASS` | **30 minutos antes** de cada clase; los eventos con hora, **al empezar** (primer día). Un solo aviso por ocurrencia |
| `reminder` | Recordatorios personales (ver más abajo) | `REMINDER` | A la hora que eligió el usuario, en su zona horaria |

- Los avisos `CLASS` los genera un planificador que corre **cada minuto** con la hora local de cada usuario (zona de #130). Detecta cada clase durante los 30 minutos previos y el aviso se deduplica por ocurrencia (materia + fecha y hora), así que sobrevive a un tick perdido sin repetirse. Solo hay clases en materias cuyo semestre tiene fechas. `myorbit.reminders.class-cron` cambia la frecuencia.
- Un tipo desactivado **no se genera**: `NotificationService` lo descarta tanto para avisos inmediatos como para los recordatorios programados, sin afectar a los demás tipos ni a otros usuarios. Las notificaciones ya creadas se conservan.
- No existe un interruptor «push»: hoy los avisos viven solo dentro de la app. Web Push (PWA) sería un cambio aparte.

## Recordatorios personales (`/api/reminders`)

El usuario escribe un texto y elige fecha y hora; a esa hora llega a Notificaciones como un aviso `REMINDER` (título «Recordatorio», mensaje = el texto). `remindAt` es la **hora local del usuario**, sin zona (`2026-11-20T08:30:00`); el mismo planificador de cada minuto que genera los avisos `CLASS` la compara con la hora local de cada usuario (zona de #130). Si el servidor estuvo dormido, el recordatorio se envía en el siguiente tick. Un recordatorio se envía una sola vez; si el usuario apagó `reminder` en sus preferencias, se descarta sin crear notificación. Cada usuario ve únicamente los suyos.

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| `GET` | `/api/reminders` | | `200` los **pendientes** (aún no enviados), el más próximo primero |
| `POST` | `/api/reminders` | `{ text, remindAt }` | `201` `{ id, text, remindAt }` · `400` si `text` está vacío o pasa de 140 caracteres, falta `remindAt` o no es posterior a la hora actual del usuario · `401` sin sesión |
| `DELETE` | `/api/reminders/{id}` | | `204` · `404` si no existe o es de otro usuario |

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


## Notificaciones push (`/api/push`)

Los avisos se guardan en la bandeja y, además, se envían a los dispositivos registrados de la cuenta (varios por usuario). Se respetan las preferencias de cada tipo de aviso. El envío corre en segundo plano y nunca hace fallar la acción que lo originó; si un dispositivo ya no existe (`404`/`410` del servicio push), se borra solo.

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| `GET` | `/api/push/config` | | `200` `{webPublicKey, webAvailable, fcmAvailable}`: la clave VAPID para suscribirse y qué canales tiene el servidor |
| `GET` | `/api/push/subscriptions` | | `200` dispositivos de la cuenta |
| `POST` | `/api/push/subscriptions` | `{channel: WEB\|FCM, address, p256dh?, auth?}` | `201` dispositivo · `400` (en `WEB` faltan `p256dh` o `auth`) |
| `DELETE` | `/api/push/subscriptions?address=` | | `204` (idempotente) |

`address` es el endpoint de la suscripción en `WEB` o el token del dispositivo en `FCM`. Registrar de nuevo el mismo `address` lo actualiza; si era de otra cuenta, pasa a la actual. Web Push se activa con `myorbit.push.vapid.public-key` y `myorbit.push.vapid.private-key` (variables `MYORBIT_PUSH_VAPID_PUBLIC_KEY` y `MYORBIT_PUSH_VAPID_PRIVATE_KEY`); sin ellas el canal `WEB` no está disponible y el resto funciona igual.

## Zona horaria de la cuenta (`PUT /api/auth/me/timezone`)

Los recordatorios, el «hoy» de los hábitos y el día en que se agrupan los avisos se calculan con la zona horaria de cada usuario, no con la del servidor (en la nube suele ser UTC).

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| `PUT` | `/api/auth/me/timezone` | `{ "timeZone": "America/Bogota" }` | `200` la cuenta con `timeZone` · `400` si es vacía o no es una zona válida · `401` sin sesión |
| `GET` | `/api/auth/me` | | incluye `timeZone` (`null` si aún no se fijó) |

- Se aceptan zonas con nombre de región (`America/Bogota`, `Europe/Madrid`) y `UTC`; no desplazamientos (`+05:00`) ni `Etc/GMT+5`.
- Una cuenta sin zona usa **America/Bogota**. El frontend guarda automáticamente la zona del dispositivo la primera vez que se abre la app, y se puede cambiar en el Perfil.
- Las fechas de tareas y evaluaciones (`due`) son hora local sin zona: se interpretan en la zona del usuario.
