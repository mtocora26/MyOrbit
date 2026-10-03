# MyOrbit - Backlog y Organización de GitHub

Estado inicial del backlog. Cada fila se convierte en un issue de GitHub. Cuando ya exista, se trabaja desde GitHub y este archivo deja de ser la fuente de verdad.

Reglas de código: [BUENAS_PRACTICAS.md](BUENAS_PRACTICAS.md) · Arquitectura: [ARQUITECTURA_Y_PATRONES.md](../ARQUITECTURA_Y_PATRONES.md)

---

## Labels

| Grupo | Labels |
|---|---|
| Tipo | `bug`, `feature`, `refactor`, `tech-debt`, `security`, `docs`, `test`, `epic` |
| Área | `area:auth`, `area:tasks`, `area:habits`, `area:categories`, `area:academic`, `area:notifications`, `area:infra`, `area:frontend` |
| Principio | `solid:srp`, `solid:ocp`, `solid:lsp`, `solid:isp`, `solid:dip`, `clean-code` |
| Prioridad | `P0` (bloquea), `P1` (importante), `P2` (puede esperar) |

## Milestones

| Milestone | Objetivo |
|---|---|
| **M0 - Base estable** | Corregir bugs y seguridad, aplicar la estructura SOLID, tener tests y CI |
| **M1 - Auth y Tareas** | Completar los módulos existentes con fechas reales y categorías |
| **M2 - Académico** | Materias, evaluaciones y cálculo de notas (Strategy) |
| **M3 - Hábitos y Categorías** | CRUD completo y estadísticas |
| **M4 - Notificaciones** | Recordatorios por eventos (Observer + Factory Method) |
| **M5 - Integraciones e Infra** | Google Calendar (Adapter), Docker Compose, despliegue |

---

## M0 - Base estable

### Épica: Corrección de bugs
| ID | Título | Labels | Detalle |
|---|---|---|---|
| M0-01 | Errores de validación devuelven 500 fuera de `/api/auth` | `bug` `P0` | El handler de `IllegalArgumentException` solo existe en `AuthController`. Moverlo al handler global. |
| M0-02 | Crear tarea acepta título vacío y cualquier prioridad | `bug` `area:tasks` `P1` | `TaskService.create` no valida el título ni usa `defaultPriority`. |
| M0-03 | Editar subtarea sin `due` borra la fecha existente | `bug` `area:tasks` `P1` | `updateSubtask` hace `setDue(blankToNull(...))` siempre. Definir semántica (null = no cambiar). |
| M0-04 | Petición sin header `Authorization` responde 400 en vez de 401 | `bug` `area:auth` `P2` | Se lanza `MissingRequestHeaderException`. Lo resuelve M0-11. |

### Épica: Refactor SOLID y buenas prácticas
| ID | Título | Labels | Detalle |
|---|---|---|---|
| M0-10 | Reorganizar paquetes por módulo y capas (`api/application/domain/infrastructure`) y renombrar a `com.app.myorbit` | `refactor` `clean-code` `P1` | Según la sección 1 de BUENAS_PRACTICAS. Hacerlo **primero** para que el resto de PRs no generen conflictos. |
| M0-11 | Resolver el usuario actual con `@CurrentUser` (argument resolver) | `refactor` `solid:isp` `solid:srp` `area:auth` `P1` | Los controllers dejan de inyectar `AuthService`. Separar `CurrentUserProvider` de `AuthService`. |
| M0-12 | Mover la verificación de propiedad (`belongsToUser`) a los servicios | `refactor` `solid:srp` `clean-code` `P1` | Elimina la duplicación en `TaskController` y `HabitController`. Métodos tipo `getOwned(userId, id)`. |
| M0-13 | Excepciones de dominio + handler global con `ProblemDetail` | `refactor` `clean-code` `P0` | `NotFoundException`, `BusinessRuleException`, `UnauthorizedException`. Quitar handlers locales de `AuthController`. Cierra M0-01 y M0-04. |
| M0-14 | Servicios retornan `Optional` o lanzan excepción en vez de `null` | `refactor` `clean-code` `P2` | `findById(...).orElse(null)` en Task y Habit. |
| M0-15 | DTOs de respuesta y mappers; no exponer entidades | `refactor` `solid:srp` `P1` | `TaskResponse`, `HabitResponse`, etc. Pasar `CreateTaskRequest` y `UpdateTaskRequest` a `record`. |
| M0-16 | Lógica del árbol de subtareas al dominio | `refactor` `solid:srp` `area:tasks` `P1` | `findSubtask`, `removeSubtask`, `synchronizeTaskCompletion` pasan a `Task`/`SubtaskTree`. Con tests unitarios. |
| M0-17 | Enums `Priority` y `HabitFrequency` en lugar de strings mágicos | `refactor` `solid:ocp` `P1` | Quitar comparaciones `"alta"`, `"personalizada"`, etc. |
| M0-18 | Inyectar `PasswordEncoder` y `Clock` como beans | `refactor` `solid:dip` `P1` | Quitar `new BCryptPasswordEncoder()` y `LocalDate.now()` directos. |
| M0-19 | Crear `UserProfileService` | `refactor` `solid:srp` `area:auth` `P2` | `UserProfileController` hoy usa el repositorio directamente. |
| M0-20 | Bean Validation en los DTOs de entrada | `refactor` `clean-code` `P1` | Agregar `spring-boot-starter-validation`. `@Valid`, `@NotBlank`, `@Email`, `@Size`. |

### Épica: Seguridad
| ID | Título | Labels | Detalle |
|---|---|---|---|
| M0-30 | CORS global con orígenes configurables | `security` `P1` | Quitar `@CrossOrigin("*")` de cada controller. |
| M0-31 | Expiración de sesiones | `security` `area:auth` `P1` | Índice TTL en `user_sessions` o migrar a JWT (decidir en el issue). |

### Épica: Limpieza, documentación, tests y CI
| ID | Título | Labels | Detalle |
|---|---|---|---|
| M0-40 | Quitar datos semilla `demo-user` y `userId` del request de tareas | `tech-debt` `area:tasks` `P1` | Seed en el constructor de `TaskService` y `defaultUser`. |
| M0-41 | Borrar restos: `data/myorbit.mv.db`, `Test/consulta.html`, `HELP.md`; ignorar `*.log` | `tech-debt` `P2` | |
| M0-42 | Actualizar MONGODB_SETUP y crear `application-local.properties.example` | `docs` `P1` | El doc actual habla de `MONGODB_URI`, que ya no aplica. |
| M0-43 | README raíz: cómo correr backend y frontend, lista de endpoints | `docs` `P1` | |
| M0-44 | Tests de dominio y servicios (árbol de subtareas, auth) | `test` `P1` | Unitarios sin Spring. |
| M0-45 | Tests de integración con Testcontainers; `contextLoads` sin Atlas | `test` `area:infra` `P1` | |
| M0-46 | CI con GitHub Actions: build y tests en cada PR | `area:infra` `P0` | Bloquear merge si falla. |

---

## M1 - Auth y Tareas
| ID | Título | Labels | Detalle |
|---|---|---|---|
| M1-01 | Fechas reales en tareas y subtareas | `feature` `area:tasks` `P0` | `due` como `LocalDateTime`, ISO-8601. Migrar datos existentes. Ordenar por fecha. |
| M1-02 | Relacionar tarea con categoría (`categoryId`) | `feature` `area:tasks` `area:categories` `P1` | Reemplaza el campo `tag` de texto libre. |
| M1-03 | Filtros de tareas: estado, rango de fechas, prioridad, categoría | `feature` `area:tasks` `P1` | |
| M1-04 | Cambiar contraseña y editar nombre | `feature` `area:auth` `P2` | |
| M1-05 | Documentar la API con OpenAPI/Swagger | `docs` `P2` | springdoc-openapi. |

## M2 - Académico (épica `area:academic`)
| ID | Título | Labels | Detalle |
|---|---|---|---|
| M2-01 | CRUD de materias | `feature` `P0` | Nombre, créditos, semestre, color. |
| M2-02 | Evaluaciones por materia con porcentaje y nota | `feature` `P0` | Validar que la suma de porcentajes sea ≤ 100%. |
| M2-03 | Cálculo de nota actual y nota necesaria (**Strategy**) | `feature` `solid:ocp` `P0` | `GradeStrategy`; usa `gradeTarget` del perfil. |
| M2-04 | Resumen académico (**Builder**) | `feature` `P2` | Promedio ponderado, materias en riesgo. |

## M3 - Hábitos y Categorías
| ID | Título | Labels | Detalle |
|---|---|---|---|
| M3-01 | Editar y eliminar categorías | `feature` `area:categories` `P1` | Definir qué pasa con las tareas asociadas. |
| M3-02 | Editar hábitos | `feature` `area:habits` `P1` | |
| M3-03 | Validar fecha (ISO) al marcar un hábito | `bug` `area:habits` `P1` | Hoy acepta cualquier string. |
| M3-04 | Rachas y estadísticas de hábitos | `feature` `area:habits` `P2` | Racha actual, mejor racha, % de cumplimiento. |

## M4 - Notificaciones (épica `area:notifications`)
| ID | Título | Labels | Detalle |
|---|---|---|---|
| M4-01 | Eventos de dominio: tarea creada/completada, hábito pendiente (**Observer**) | `feature` `P1` | `ApplicationEventPublisher` de Spring. |
| M4-02 | Creación de notificaciones por tipo (**Factory Method**) | `feature` `solid:ocp` `P1` | Deadline, evento, hábito. |
| M4-03 | Endpoint para listar y marcar como leídas | `feature` `P1` | |
| M4-04 | Recordatorios programados (`@Scheduled`) | `feature` `P2` | |

## M5 - Integraciones e Infraestructura
| ID | Título | Labels | Detalle |
|---|---|---|---|
| M5-01 | ADR: monolito modular vs microservicios | `docs` `area:infra` `P1` | El documento de arquitectura plantea microservicios; hoy es un monolito. Decidir y documentar. |
| M5-02 | Docker Compose: backend + Mongo + frontend | `area:infra` `P1` | |
| M5-03 | Exponer health de Actuator | `area:infra` `P2` | Actuator ya está como dependencia. |
| M5-04 | Integración con Google Calendar (**Adapter**) | `feature` `solid:dip` `P2` | Puerto `CalendarGateway` en dominio; adaptador Google en infraestructura. |
| M5-05 | API Gateway (si el ADR elige microservicios) | `area:infra` `P2` | |

---

## Orden sugerido para empezar

1. **M0-10** (estructura de paquetes): base para todo lo demás.
2. **M0-46** (CI) y **M0-13** (manejo de errores).
3. **M0-11**, **M0-12**, **M0-18** (SOLID en auth y servicios).
4. Bugs restantes de M0 y luego **M1-01** (fechas reales).
