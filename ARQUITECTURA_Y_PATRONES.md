# MyOrbit - Arquitectura y Patrones (Guia de Trabajo)

Este documento organiza MyOrbit en 3 niveles de patrones para mantener decisiones tecnicas claras durante el desarrollo.

## 1) Nivel de Infraestructura

Define como se despliega y se comunica el sistema a nivel de servicios.

### Patron elegido
- Microservicios orientados a APIs REST.

### Que se trabaja aqui
- Separacion por servicios de negocio:
  - Auth Service
  - Tasks Service
  - Academic Service (materias + calificaciones)
  - Habits Service
  - Notification Service
- API Gateway como punto unico de entrada para frontend.
- Base de datos por servicio (ideal). Para clase, se permite una sola instancia Mongo con BD separada por servicio.
- Comunicacion entre servicios:
  - Sincrona por REST al inicio.
  - Asincrona por eventos como mejora (por ejemplo, tarea creada -> notificacion).
- Observabilidad minima:
  - Health checks por servicio.
  - Logs por servicio.
- Ejecucion local:
  - Docker Compose para levantar stack completo.

### Entregables tecnicos
- Diagrama de servicios y relaciones.
- Coleccion de endpoints por microservicio.
- Evidencia de pruebas de integracion entre servicios.

---

## 2) Nivel de Arquitectura de Aplicacion

Define como se organiza internamente cada microservicio y el frontend.

### Patron recomendado
- Backend: Arquitectura en capas con enfoque Clean (ligero).
- Frontend: Arquitectura por features/screens + capa de servicios API.

### Backend por microservicio (estructura sugerida)
- controller: endpoints REST.
- application/service: casos de uso.
- domain/model: entidades y reglas de negocio.
- infrastructure/repository: acceso a datos y adaptadores externos.
- dto: contratos de entrada/salida.

### Frontend (estructura sugerida)
- screens: vistas por funcionalidad.
- components: componentes reutilizables.
- services/api: llamadas HTTP al gateway.
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
  - Integracion con Google Calendar sin acoplar dominio.
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

- Infraestructura: Microservicios + API Gateway.
- Arquitectura por servicio: Capas con enfoque Clean ligero.
- Patrones GoF prioritarios para implementar primero:
  1. Strategy (calificaciones)
  2. Adapter (Google Calendar)
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
| Modo offline | Solo shell offline | El service worker precachea el build; `/api` nunca pasa por el service worker (sin cache de datos ni tokens). `OfflineBanner` avisa cuando no hay red. |
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
El flag `--add-host` solo hace falta fuera de Docker Compose (nginx resuelve el host `backend`).

### Evidencia de prueba (2026-10-10)
- Rutas via nginx: `/` 200, `/tareas/123` 200 (fallback), `/assets/no.js` 404, `/api/*` llega al backend.
- Login y pantalla principal funcionando con front en contenedor y backend en Spring.
- Instalacion como app y modo offline (franja "Sin conexion") verificados en el celular via ngrok.
- Lighthouse: Rendimiento 83, Accesibilidad 72, Mejores practicas 100, SEO 91 (Lighthouse ya no incluye categoria PWA).

---

## Orden de implementacion sugerido

1. Gateway + Auth + Tasks.
2. Academic (materias/calificaciones).
3. Habits.
4. Notifications.
5. Integraciones externas (Google Calendar).

Con este marco, cada avance tecnico debe indicar:
- Nivel afectado (Infraestructura / Arquitectura app / GoF).
- Objetivo del cambio.
- Evidencia de prueba.

---

Ver también: [docs/BUENAS_PRACTICAS.md](docs/BUENAS_PRACTICAS.md) (SOLID y convenciones de código) y [docs/BACKLOG.md](docs/BACKLOG.md) (issues y milestones).
