# MyOrbit - Arquitectura y Patrones (Guia de Trabajo)

Este documento organiza MyOrbit en 3 niveles de patrones para mantener decisiones tecnicas claras durante el desarrollo.

## 1) Nivel de Infraestructura

Define como se despliega y se comunica el sistema a nivel de servicios.

### Patron elegido
- **Monolito modular** con API REST (decision: [ADR 0001](docs/adr/0001-monolito-modular.md)). El plan original de microservicios no se implemento y se descarto.

### Que se trabaja aqui
- Un modulo por area de negocio dentro de la misma aplicacion Spring Boot:
  - `users` (cuentas y sesion)
  - `tasks`
  - `categories`
  - `academic` (semestres, materias, evaluaciones y notas)
  - `events`
  - `habits`
  - `notifications`
- Un modulo solo habla con otro a traves de su **servicio de aplicacion**, nunca con su repositorio. El grafo de dependencias no tiene ciclos y `notifications` es el unico que consume a los demas.
- Una sola base MongoDB (`myorbit`) y un solo despliegue. El frontend entra por una sola ruta `/api`; no hay API Gateway.
- Observabilidad minima: `/actuator/health` y logs de la aplicacion.
- Ejecucion local: backend con Maven y frontend con Vite (ver README). Docker Compose se descarto (#45).

### Entregables tecnicos
- Documentacion de la API en `docs/API.md`.
- ADR con la decision y sus disparadores de revision: `docs/adr/0001-monolito-modular.md`.

---

## 2) Nivel de Arquitectura de Aplicacion

Define como se organiza internamente cada modulo del backend y el frontend.

### Patron recomendado
- Backend: Arquitectura en capas con enfoque Clean (ligero).
- Frontend: Arquitectura por features/screens + capa de servicios API.

### Backend por modulo (estructura sugerida)
- controller: endpoints REST.
- application/service: casos de uso.
- domain/model: entidades y reglas de negocio.
- infrastructure/repository: acceso a datos y adaptadores externos.
- dto: contratos de entrada/salida.

### Frontend (estructura sugerida)
- screens: vistas por funcionalidad.
- components: componentes reutilizables.
- services/api: llamadas HTTP al backend.
- models: tipos y contratos de datos.
- state/hooks: estado y logica de presentacion.

### Que se trabaja aqui
- Contratos API claros (request/response).
- Validaciones de negocio en servicios, no en controladores.
- Manejo centralizado de errores.
- Versionado de APIs cuando sea necesario.

### Entregables tecnicos
- Estructura de carpetas por servicio consistente.
- Mapeo endpoint -> caso de uso.
- Estrategia de manejo de errores y codigos HTTP.

---

## 3) Nivel de Patrones de Diseno (GoF)

Define patrones de codigo para resolver problemas repetitivos dentro de servicios/modulos.

### Patrones GoF seleccionados para MyOrbit
- Strategy:
  - Calculo de notas objetivo y reglas de priorizacion.
- Factory Method:
  - Creacion de notificaciones segun tipo (deadline, evento, habito).
- Adapter:
  - Envio de Web Push sin acoplar dominio: puerto `PushSender`, adaptador `WebPushSender`.
- Observer:
  - Eventos de dominio (tarea creada/completada) que disparan recordatorios.
- Facade:
  - Exponer una API simple de agregacion para frontend cuando combine datos de varios servicios.
- Builder:
  - Construccion de respuestas compuestas (resumen academico, dashboard diario).

### Patrones complementarios (no GoF, pero clave)
- Repository: abstraccion de persistencia.
- DTO: estabilidad del contrato entre frontend y backend.
- Dependency Injection: desacoplamiento y testabilidad con Spring.

### Que se trabaja aqui
- Evitar logica duplicada.
- Reducir acoplamiento entre capas y servicios.
- Preparar codigo para cambio de infraestructura (memoria -> Mongo, REST -> evento).

### Entregables tecnicos
- Ejemplos por patron aplicado en codigo.
- Justificacion breve de por que se uso cada patron.

---

## Decision actual del proyecto (estado objetivo)

- Infraestructura: Monolito modular, sin API Gateway (ADR 0001).
- Arquitectura por servicio: Capas con enfoque Clean ligero.
- Patrones GoF prioritarios para implementar primero:
  1. Strategy (calificaciones)
  2. Adapter (Web Push)
  3. Observer (recordatorios)

## Decision: frontend como SPA servida con nginx y PWA (#64)

- **Nivel afectado:** Infraestructura y Arquitectura de aplicacion (frontend).
- **Objetivo:** servir el front como SPA estable e instalable como PWA, con Spring Boot como API pura.

### Decisiones
| Tema | Decision | Motivo |
|---|---|---|
| Quien sirve el front | nginx en contenedor (`frontend/Dockerfile`, `frontend/nginx.conf`) | El backend queda como API; despliegues independientes; mismo origen para front y API (necesario para PWA y service worker). Encaja con M5-02. |
| URL de la API | Ruta relativa `/api/...` (`API_BASE_URL` vacio en `src/services/apiConfig.ts`) | El build funciona en cualquier dominio. Con otro dominio se fija `VITE_API_BASE_URL` al compilar. |
| Desarrollo | Proxy de `/api` en Vite hacia `localhost:8080` (`VITE_DEV_API_TARGET` lo cambia) | Mismo comportamiento que produccion, sin CORS. |
| Fallback SPA | `try_files $uri /index.html` salvo `/api/` y `/assets/` (un asset inexistente da 404) | Refrescar en cualquier ruta no da 404. |
| Router | No se agrega `react-router` | La navegacion es por estado en `App.tsx`; la PWA no lo exige. Issue aparte si se necesitan deep-links. |
| Modo offline | Solo shell offline (ampliado despues: copia de lecturas y cola de tareas, ver docs/ANDROID.md) | El service worker precachea el build; `/api` nunca pasa por el service worker (sin cache de datos ni tokens). `OfflineBanner` avisa cuando no hay red. |
| CORS | Sin cambios por ahora (`@CrossOrigin("*")`) | Ya no hace falta con un solo origen; quitarlo es una mejora de seguridad aparte. |

### PWA
- `vite-plugin-pwa` genera `manifest.webmanifest` y `sw.js` (config en `frontend/vite.config.ts`, `registerType: 'autoUpdate'`).
- Iconos provisionales en `frontend/public/` (planeta y orbita); reemplazables sin tocar codigo.
- HTTPS es requisito para instalar: `localhost` sirve para probar, en el celular se uso un tunel (ngrok).

### Como probarlo
```bash
cd frontend && docker build -t myorbit-front .
docker run -d --rm --name myorbit-front-test -p 3000:80 --add-host backend:host-gateway myorbit-front
# backend en :8080; abrir http://localhost:3000
```
El flag `--add-host` permite que nginx resuelva el host `backend` en la maquina local.

### Evidencia de prueba (2026-10-10)
- Rutas via nginx: `/` 200, `/tareas/123` 200 (fallback), `/assets/no.js` 404, `/api/*` llega al backend.
- Login y pantalla principal funcionando con front en contenedor y backend en Spring.
- Instalacion como app y modo offline (franja "Sin conexion") verificados en el celular via ngrok.
- Lighthouse: Rendimiento 83, Accesibilidad 72, Mejores practicas 100, SEO 91 (Lighthouse ya no incluye categoria PWA).

---

## Orden de implementacion sugerido

1. Auth + Tasks.
2. Academic (materias/calificaciones).
3. Habits.
4. Notifications.

Con este marco, cada avance tecnico debe indicar:
- Nivel afectado (Infraestructura / Arquitectura app / GoF).
- Objetivo del cambio.
- Evidencia de prueba.

---

Ver también: [docs/BUENAS_PRACTICAS.md](docs/BUENAS_PRACTICAS.md) (SOLID y convenciones de código) y [docs/BACKLOG.md](docs/BACKLOG.md) (issues y milestones).

## Decision: eventos de dominio con Observer (#40)

- **Nivel afectado:** Aplicación (módulos `tasks` y `habits`).
- **Objetivo:** que las notificaciones (M4-02/M4-04) reaccionen a lo que ocurre en tareas y hábitos sin que esos módulos las conozcan.

| Evento | Paquete | Cuándo se publica |
|---|---|---|
| `TaskCreatedEvent(userId, taskId, title, due)` | `tasks.domain` | Después de guardar una tarea nueva. |
| `TaskCompletedEvent(userId, taskId, title)` | `tasks.domain` | Cuando la tarea **pasa** de pendiente a completada: por estado de la tarea, al completar su última subtarea o al borrar la última pendiente. No se repite si ya estaba completada. |
| `HabitPendingEvent(userId, habitId, title, date)` | `habits.domain` | Por cada hábito programado para `date` y no cumplido ese día, al invocar `HabitService.publishPendingHabits(date)`. |

- Se publican con `ApplicationEventPublisher` de Spring, **después** de persistir; si la operación falla no se emite nada.
- Los eventos son `record` inmutables en `domain`; los observadores los consumen con `@EventListener` en su propio módulo (misma técnica que `CategoryDeletedEvent`).
- `publishPendingHabits` solo detecta y notifica; quien lo llama periódicamente es el recordatorio programado (M4-04). Un hábito `diaria` está programado todos los días; uno `personalizada`, en sus `daysOfWeek` (1 = lunes … 7 = domingo).

## Decision: notificaciones por tipo con Factory Method (#41)

- **Nivel afectado:** Aplicación (módulo nuevo `notifications`).
- **Objetivo:** crear notificaciones distintas según el origen sin `if/switch` por tipo, de modo que un tipo nuevo no obligue a modificar código existente (OCP).

| Tipo | Origen (evento del #40) | Fábrica |
|---|---|---|
| `DEADLINE` | `TaskCreatedEvent` con `due` (sin fecha no se notifica) | `DeadlineNotificationFactory` |
| `EVENT` | `TaskCompletedEvent` | `EventNotificationFactory` |
| `HABIT` | `HabitPendingEvent` | `HabitNotificationFactory` |

- `NotificationFactory` es la interfaz; `AbstractNotificationFactory` arma los campos comunes (id, usuario, referencia, fecha, `read = false`) y cada subclase aporta `title()` y `message()` (los factory methods).
- `NotificationService` indexa las fábricas por tipo con las que inyecta Spring y **falla al arrancar** si falta una fábrica o hay dos para el mismo tipo. `NotificationEventListener` observa los eventos y llama a `notify(...)`.
- Un fallo al crear una notificación se registra en el log y no se propaga: la tarea u hábito ya guardados no se deshacen.
- Agregar un tipo: valor en `NotificationType` + una subclase `@Component`. Listar y marcar como leídas llega en M4-03 (#42).

## Decision: recordatorios programados (#43)

- **Nivel afectado:** Aplicación/infraestructura (`notifications`, con apoyo de `tasks` y `habits`).
- **Objetivo:** avisar sin que el usuario abra la app, reutilizando el Observer (#40) y las fábricas (#41).

| Pieza | Responsabilidad |
|---|---|
| `ReminderScheduler` (`@Scheduled`) | Cada día (08:00 por defecto) invoca `HabitService.publishPendingHabits(hoy)` y `TaskService.publishDueSoon(ahora, ahora + 24 h)`. Solo publica eventos. |
| `TaskDueSoonEvent` / `HabitPendingEvent` | Eventos de dominio de los recordatorios. |
| `NotificationEventListener` | Los convierte en `DEADLINE` / `HABIT` con `notifyOncePerDay`. |
| `NotificationService.notifyOncePerDay` | Omite el aviso si ya hay uno igual (usuario + tipo + referencia) creado hoy, así reiniciar la app o ejecutar el job dos veces no duplica notificaciones. |

- Configuración: `myorbit.reminders.enabled` (por defecto `true`), `myorbit.reminders.cron` (por defecto cada hora, `0 0 * * * *`) y `myorbit.reminders.hour` (hora local del recordatorio, 8 por defecto). **Actualizado en #130:** el planificador ya no corre una vez al día en la zona del servidor; cada hora recorre los usuarios activos y avisa a quien, **en su zona horaria**, está en la hora del recordatorio. `UserZoneService` (módulo `users`) responde «qué día y hora es para este usuario» y lo usan hábitos (hoy, racha, fecha de creación), tareas por vencer y la deduplicación diaria de avisos. Con el servidor en UTC el aviso sigue llegando a las 08:00 de cada usuario. `@EnableScheduling` vive en `shared/config/SchedulingConfig`.
- Cada recordatorio corre aislado: si uno falla se registra en el log y el otro se ejecuta igual.
- Solo se consideran tareas pendientes con `due` en las próximas 24 h; las subtareas no generan recordatorio por ahora.
- Limitación: con varias instancias del backend el job correría en cada una; el dedupe por día evita avisos repetidos, pero un lock distribuido queda fuera de alcance.
