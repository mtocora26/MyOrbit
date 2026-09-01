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
