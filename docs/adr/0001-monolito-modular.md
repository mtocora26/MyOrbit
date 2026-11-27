# ADR 0001: monolito modular en lugar de microservicios

- **Estado:** aceptado (fusionado en #247)
- **Fecha:** 2026-11-23
- **Issue:** #44 (`M5-01`)
- **Afecta:** `ARQUITECTURA_Y_PATRONES.md` (nivel 1, infraestructura), #48 (API Gateway)

## Contexto

`ARQUITECTURA_Y_PATRONES.md` planteó desde el inicio microservicios (Auth, Tasks, Academic, Habits, Notification) detrás de un API Gateway. El código nunca los implementó: hoy es **una sola aplicación Spring Boot** con un módulo por área (`users`, `tasks`, `categories`, `academic`, `events`, `habits`, `notifications`, `shared`). Hay que decidir cuál es el estado objetivo y dejar de tener un documento que dice una cosa y un código que hace otra.

Lo que muestra el repositorio hoy:

| Dato | Valor |
|---|---|
| Tamaño del backend | ~6 800 líneas de Java en 7 módulos y `shared` (el mayor, `academic`, ~1 800) |
| Pruebas | 85 clases de prueba; las de integración usan Testcontainers |
| Base de datos | Una sola base MongoDB (`myorbit`), un esquema por módulo |
| Despliegue | Un contenedor en Render (plan gratuito, 512 MB, `-Xmx380m`) + frontend estático en Cloudflare Pages + Mongo Atlas |
| Tareas programadas | 2 (`ReminderScheduler`, `ClassReminderScheduler`), dentro del mismo proceso |
| Historial | Un solo autor activo |

Dependencias entre módulos (solo imports de otros módulos, sin contar `shared`):

```
users          ← (base: todos dependen de ella)
categories     → users
academic       → users
habits         → users
tasks          → users, academic, categories
events         → users, academic, categories
notifications  → users, academic, events, habits, tasks
```

El grafo es **acíclico** y tiene una sola dirección: `notifications` está arriba y nadie depende de ella. Hay una excepción puntual a la regla «un módulo no usa el repositorio de otro»: `tasks/infrastructure/TaskCategoryMigration` importa `CategoryRepository`.

## Decisión

**MyOrbit sigue siendo un monolito modular.** Un solo despliegue, un módulo por área de negocio, y las fronteras entre módulos se cuidan como si fueran servicios:

1. Un módulo solo habla con otro a través de su **servicio de aplicación** (ya está en `CLAUDE.md` y `docs/BUENAS_PRACTICAS.md`).
2. El grafo de dependencias de arriba **no tiene ciclos** y `notifications` sigue siendo el único módulo que consume a los demás.
3. Nada de lo que hoy se comparte (MongoDB, sesión, zona horaria del usuario) se duplica por módulo.
4. **No se crea el API Gateway (#48).** El frontend ya llega al backend por una sola ruta `/api`; un gateway añadiría un salto de red sin resolver ningún problema actual.

`ARQUITECTURA_Y_PATRONES.md` se actualiza para que su «estado objetivo» diga esto. Lo demás de ese documento (capas por módulo, patrones Strategy, Adapter y Observer) no cambia.

## Por qué

- **El plan de despliegue no lo soporta.** Cinco servicios son cinco JVM; con 512 MB en total (hoy 380 MB de heap para una sola) no caben ni en el plan gratuito ni en uno barato. Obligaría a pagar por infraestructura que el producto no necesita.
- **No hay un problema que los microservicios resuelvan.** No hay equipos que se pisen, ni un módulo con una carga que escale distinto, ni un ciclo de despliegue independiente. La app se usa en sesiones cortas desde el celular.
- **Los datos están acoplados por diseño.** Las notificaciones leen tareas, evaluaciones, clases, hábitos y eventos; la agenda mezcla clases, evaluaciones y entregas. Separarlos obligaría a copiar datos o a cruzar la red en cada consulta (el patrón «dato por servicio» del documento original).
- **Coste de operación para un equipo pequeño.** Autenticación entre servicios, trazas distribuidas, versionado de contratos, pruebas de integración entre servicios y un compose con cinco piezas son trabajo que no aporta funciones al estudiante.
- **El código ya está listo para separarse si hiciera falta.** El grafo es acíclico y el único punto de entrada entre módulos es el servicio de aplicación, que es justo la costura por la que se cortaría.

## Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| **Microservicios con API Gateway** (plan original) | Costes de arriba, sin beneficio hoy. Obligaba además a repartir Mongo y la sesión. |
| **Dos servicios: API + notificaciones** | El único candidato razonable (tiene el planificador y es el módulo más alto del grafo), pero en el plan gratuito el servicio ya duerme tras 15 min sin tráfico; separarlo no arregla los recordatorios y dobla la memoria. Se revisa cuando haya un plan de pago (ver disparadores). |
| **Monolito sin fronteras** | Barato ahora, caro después: sin reglas, `notifications` y `tasks` acabarían con ciclos. |

## Consecuencias

**Buenas**
- Un `docker compose` con backend, Mongo y frontend (`M5-02`) basta para el entorno local. (Después se descartó en #45: no hizo falta.)
- Un solo log, un solo `/actuator/health`, un solo despliegue.
- Transacciones y consultas entre módulos son llamadas a método, no a red.

**Malas, y cómo se mitigan**
- Las fronteras dependen de disciplina, no del compilador. Hoy se revisa en el PR; el siguiente paso razonable es un test de arquitectura (p. ej. ArchUnit) que falle si un módulo importa el repositorio de otro o si aparece un ciclo. Queda **fuera de este issue**; se propone como issue aparte.
- La excepción `TaskCategoryMigration → CategoryRepository` es una migración de datos puntual. Se tolera o se mueve cuando se cree el test de arquitectura.
- Un fallo o un pico en un módulo afecta a todo el proceso. Aceptable a esta escala.

## Cuándo reabrir esta decisión

Se reevalúa si ocurre alguna de estas cosas, no antes:

1. El planificador de recordatorios necesita **escalar o fallar por separado** del resto de la API (p. ej. al pasar a un plan de pago con muchos usuarios).
2. Entra un **segundo equipo** que necesite desplegar un módulo con su propio ritmo.
3. Un módulo pasa a depender de una tecnología distinta (otro lenguaje, otra base de datos).
4. El despliegue conjunto deja de caber en la instancia contratada.

El primer corte a considerar sería `notifications`, por su posición en el grafo.

## Qué cambia en el repositorio

- Este documento.
- `ARQUITECTURA_Y_PATRONES.md`: el «estado objetivo» pasa de «Microservicios + API Gateway» a «Monolito modular».
- `docs/BACKLOG.md`: `M5-05` (API Gateway) queda marcado como descartado por este ADR.
- #48 se puede cerrar como «no planificado» al fusionar.
