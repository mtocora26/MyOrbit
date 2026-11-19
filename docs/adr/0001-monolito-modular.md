# ADR 0001: Monolito modular en lugar de microservicios

- **Estado:** Propuesto
- **Fecha:** 2026-11-19
- **Issue:** #44 (M5-01)

## Contexto

`ARQUITECTURA_Y_PATRONES.md` planteaba microservicios con API Gateway (Auth, Tasks, Academic, Habits, Notification).
Lo que existe hoy es un único backend Spring Boot con una sola base MongoDB, organizado por funcionalidad
(`users`, `tasks`, `academic`, `habits`, `categories`, `events`, `notifications`) y por capas
(`api → application → domain ← infrastructure`). Un módulo no usa el repositorio de otro: llama a su servicio de aplicación.

El producto es una app móvil de estudiantes, sin equipos separados por servicio, con un solo despliegue y una sola persona
operándolo. Los recordatorios y el resumen de Inicio cruzan datos de tareas, materias, hábitos y eventos.

## Decisión

Se mantiene **un monolito modular**. Cada módulo es una frontera que se podría extraer después, y se respeta así:

- Sin acceso al repositorio de otro módulo; solo a su servicio de aplicación.
- El dominio no depende de Spring ni de Mongo.
- Dependencias externas (Google Calendar, envío de notificaciones) detrás de puertos.
- Comunicación entre módulos en proceso; los eventos pueden añadirse sin red de por medio.

**No se implementa API Gateway** (M5-05, #48): con un solo backend, el frontend ya tiene un único punto de entrada en
`/api` (proxy de Vite en desarrollo, nginx en producción).

## Consecuencias

**A favor**
- Un solo artefacto que desplegar, depurar y probar; sin latencia ni fallos de red entre módulos.
- Consultas y recordatorios que cruzan módulos siguen siendo simples y consistentes.
- Docker Compose (#45) queda en tres contenedores: backend, Mongo y frontend.

**En contra**
- No se escala ni se despliega cada módulo por separado.
- Las fronteras dependen de disciplina del equipo, no de la red; hay que vigilarlas en revisión.
- No hay aislamiento de fallos entre módulos.

## Cuándo reconsiderarlo

Extraer un módulo a servicio solo si aparece una necesidad medida: una carga muy distinta (p. ej. envío masivo de
notificaciones), equipos independientes o un requisito de aislamiento. El primer candidato sería `notifications`.

## Alternativas descartadas

- **Microservicios + Gateway:** coste de operación (varios despliegues, red, autenticación entre servicios, bases
  separadas) sin beneficio para el tamaño y el equipo actuales.
