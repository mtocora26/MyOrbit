# MyOrbit - Principios SOLID y Buenas Prácticas

Guía de codificación del backend. Complementa [ARQUITECTURA_Y_PATRONES.md](../ARQUITECTURA_Y_PATRONES.md): ese documento define **qué** arquitectura y patrones usamos; este define **cómo** escribimos el código.

Todo PR debe cumplir esta guía. Si algo no aplica o hay que romper una regla, se justifica en la descripción del PR.

---

## 1. Estructura de paquetes

Organizamos por **módulo de negocio** (package-by-feature) y, dentro de cada módulo, por **capas** (Clean ligero):

```text
com.app.myorbit
├── shared/                      # Transversal: errores, seguridad, config
│   ├── error/                   # Excepciones de dominio + handler global
│   ├── security/                # @CurrentUser, resolución de sesión
│   └── config/                  # CORS, Clock, PasswordEncoder, etc.
├── tasks/
│   ├── api/                     # Controllers + DTOs request/response + mappers
│   ├── application/             # Casos de uso (servicios)
│   ├── domain/                  # Entidades, enums, reglas de negocio, puertos
│   └── infrastructure/          # Adaptadores: Mongo, APIs externas
├── habits/   (misma estructura)
├── categories/
├── users/
└── academic/
```

**Regla de dependencias:** `api → application → domain ← infrastructure`.
El `domain` no conoce Spring Web, ni Mongo, ni DTOs.

Un módulo **no** accede al repositorio de otro módulo; usa su servicio de aplicación.

---

## 2. Principios SOLID aplicados a MyOrbit

### S - Responsabilidad Única (SRP)

> Una clase debe tener una sola razón para cambiar.

**Problema actual:** `TaskService` crea tareas, aplica valores por defecto, siembra datos de prueba y maneja toda la lógica del árbol de subtareas. Los controllers resuelven la sesión y además verifican que el recurso pertenezca al usuario.

**Cómo lo aplicamos:**
- La lógica del árbol de subtareas (buscar, eliminar, sincronizar `done`) vive en el **dominio** (`Task` / `SubtaskTree`), no en el servicio.
- Los **controllers** solo traducen HTTP ↔ caso de uso: validan la entrada, llaman al servicio y mapean la respuesta.
- La verificación de propiedad (`belongsToUser`) va en el servicio de aplicación: `taskService.getOwned(userId, taskId)`.
- Los datos semilla no van en constructores de servicios.

```java
// Evitar: el controller decide reglas de negocio
if (!belongsToUser(taskService.findById(id), authorization)) return ResponseEntity.notFound().build();

// Preferir: el caso de uso garantiza la regla
@PatchMapping("/{id}/status")
public TaskResponse updateStatus(@CurrentUser UserId user, @PathVariable String id,
                                 @Valid @RequestBody UpdateTaskStatusRequest request) {
    return TaskMapper.toResponse(taskService.updateStatus(user, id, request.done()));
}
```

### O - Abierto/Cerrado (OCP)

> Abierto a extensión, cerrado a modificación.

**Problema actual:** reglas basadas en strings mágicos: `"alta" | "media" | "baja"`, `"personalizada" | "diaria"`. Agregar una frecuencia "semanal" obliga a modificar `if`s dispersos.

**Cómo lo aplicamos:**
- Valores cerrados → **enums** (`Priority`, `HabitFrequency`).
- Comportamiento que varía → **Strategy**. Ej: cálculo de notas (`GradeStrategy`), días programados de un hábito (`HabitSchedule`), tipos de notificación (Factory Method).

```java
public interface GradeStrategy {
    double requiredGrade(List<Evaluation> evaluations, double target);
}
// Nueva forma de calcular = nueva clase, sin tocar las existentes.
```

### L - Sustitución de Liskov (LSP)

> Una implementación debe poder reemplazar a su abstracción sin romper el comportamiento esperado.

**Cómo lo aplicamos:**
- Toda implementación de un puerto (`TaskRepository`, `CalendarGateway`, `NotificationSender`) respeta el mismo contrato: mismas excepciones, mismo manejo de "no encontrado" (`Optional`), sin efectos secundarios ocultos.
- Si una subclase necesita lanzar `UnsupportedOperationException`, la abstracción está mal diseñada → dividir la interfaz (ver ISP).
- Preferimos **composición sobre herencia**. La herencia solo se usa cuando hay una relación "es-un" real.
- Los contratos de los puertos se documentan y se prueban (los mismos tests deben pasar con el adaptador real y con un fake).

### I - Segregación de Interfaces (ISP)

> Ningún cliente debe depender de métodos que no usa.

**Problema actual:** todos los controllers inyectan `AuthService` completo (register, login, logout...) solo para llamar a `requireUser`.

**Cómo lo aplicamos:**
- Separar `AuthService` (registro/login/logout) de `CurrentUserProvider` (resolver la sesión).
- Mejor aún: un `HandlerMethodArgumentResolver` con la anotación `@CurrentUser`, para que los controllers no dependan de autenticación en absoluto.
- Puertos pequeños y enfocados: `CalendarReader` y `CalendarWriter` en lugar de un `CalendarService` gigante, si los clientes lo justifican.

### D - Inversión de Dependencias (DIP)

> Depender de abstracciones, no de implementaciones concretas.

**Problema actual:**
- `AuthService` hace `new BCryptPasswordEncoder()` en lugar de recibir un `PasswordEncoder`.
- `HabitService` usa `LocalDate.now()` directamente → imposible de probar con fechas fijas.

**Cómo lo aplicamos:**
- Inyección **por constructor** siempre (nunca `@Autowired` en campos).
- Dependencias externas detrás de interfaces/beans: `PasswordEncoder`, `Clock`, `CalendarGateway`, `NotificationSender`.
- Los casos de uso dependen de **puertos** definidos en `domain`; los adaptadores Mongo/Google viven en `infrastructure`.

```java
@Bean Clock clock() { return Clock.system(ZoneId.of("America/Bogota")); }
@Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

public HabitService(HabitRepository habits, Clock clock) { ... }
LocalDate today = LocalDate.now(clock);   // testeable
```

---

## 3. Buenas prácticas de código

### Principios generales
- **DRY:** si copias un bloque por tercera vez, extráelo (ej: el `belongsToUser` repetido en cada controller).
- **KISS:** la solución más simple que cumpla el requisito.
- **YAGNI:** no construir funcionalidad "por si acaso".
- **Guard clauses** en lugar de `if` anidados.
- Métodos cortos (~20 líneas) con un solo nivel de abstracción.
- Sin código comentado ni código muerto (se borra, git lo recuerda).

### Nombres e idioma
- **Código en inglés** (clases, métodos, variables). **Mensajes al usuario en español.**
- Clases: sustantivos (`TaskService`, `GradeCalculator`). Métodos: verbos (`markAsDone`, `calculateRequiredGrade`).
- Booleanos: `isDone`, `hasSubtasks`, `canEdit`.
- Paquetes en minúscula (`com.app.myorbit`, no `com.app.MyOrbit`).
- Sin abreviaturas crípticas (`req`, `tmp`, `t1`).

### DTOs y entidades
- **Nunca exponer entidades** en la API: request y response son `record`s en `api/`.
- Mapeo explícito con mappers (`TaskMapper.toResponse(task)`).
- Las entidades protegen sus invariantes con métodos de dominio (`task.complete()`), no solo con setters.

### Validación
- **Formato** en el borde, con Bean Validation: `@NotBlank`, `@Email`, `@Size`, `@Valid`.
- **Reglas de negocio** en dominio/aplicación (ej: "no existe otra categoría con ese nombre").

### Manejo de errores
- Excepciones de dominio propias: `NotFoundException`, `BusinessRuleException`, `UnauthorizedException`.
- **Un solo** `@RestControllerAdvice` global que devuelve `ProblemDetail` (RFC 9457) con el código HTTP correcto: 400, 401, 404, 409.
- No usar `null` como señal de error: retornar `Optional` o lanzar una excepción.
- No exponer stack traces ni mensajes internos al cliente.

| Situación | Excepción | HTTP |
|---|---|---|
| Entrada inválida | `MethodArgumentNotValidException` | 400 |
| Sin sesión / sesión inválida | `UnauthorizedException` | 401 |
| Recurso inexistente o de otro usuario | `NotFoundException` | 404 |
| Conflicto (duplicado) | `BusinessRuleException` | 409 |

### Fechas
- `java.time` siempre (`LocalDate`, `LocalDateTime`, `Instant`). Nada de fechas como texto libre.
- Formato ISO-8601 en la API.
- La hora actual se obtiene de un `Clock` inyectado.

### Configuración y secretos
- **Nunca** subir credenciales a git. Van en `application-local.properties` (ignorado) o en variables de entorno.
- Mantener un `application-local.properties.example` con valores de ejemplo.
- Configuración por perfiles (`local`, `test`, `prod`).

### Seguridad
- CORS configurado una vez y globalmente, con orígenes explícitos (no `*` en producción).
- Contraseñas solo con hash (BCrypt), nunca se loguean.
- Sesiones con expiración.
- El `userId` siempre se toma de la sesión, nunca del body.

### Logging
- SLF4J (`private static final Logger log = LoggerFactory.getLogger(...)`), nunca `System.out`.
- Niveles: `ERROR` para fallos, `WARN` para situaciones anómalas recuperables, `INFO` para eventos de negocio, `DEBUG` para detalle.
- No loguear datos sensibles (contraseñas, tokens).

---

## 4. Testing

| Tipo | Qué cubre | Herramienta |
|---|---|---|
| Unitario | Dominio y casos de uso (sin Spring) | JUnit 5 + Mockito/fakes |
| Slice web | Controllers: validación, códigos HTTP, JSON | `@WebMvcTest` + MockMvc |
| Integración | Repositorios Mongo | `@DataMongoTest` + Testcontainers |

- Nombre de los tests: `should<Resultado>_when<Condición>` (ej: `shouldMarkParentDone_whenAllSubtasksAreDone`).
- Estructura **Arrange / Act / Assert**.
- Todo bug corregido incluye un test que lo reproduce.
- Los tests no dependen de Atlas ni de datos reales.

---

## 5. Flujo de trabajo con Git y GitHub

- **Ramas:** `main` es estable. Se trabaja en `tipo/<n°issue>-descripcion-corta`:
  `feature/12-fechas-reales-tareas`, `fix/3-error-500-validacion`, `refactor/20-current-user-resolver`.
- **Commits** con [Conventional Commits](https://www.conventionalcommits.org/es/):
  `feat(tasks): agregar filtro por prioridad`, `fix(auth): responder 401 sin header`, `refactor(habits): extraer HabitFrequency enum`, `test:`, `docs:`, `chore:`.
- **Pull Requests** hacia `main`, pequeños (idealmente menos de 400 líneas), enlazados al issue con `Closes #n`, con al menos 1 revisión y CI en verde.
- Merge con **squash**.

### Definition of Done
Un issue está terminado cuando:
- [ ] El código cumple esta guía (SOLID, capas, nombres, errores).
- [ ] Tiene tests y pasan en CI.
- [ ] No hay credenciales ni código muerto.
- [ ] Los endpoints nuevos o cambiados están documentados.
- [ ] El PR fue revisado y aprobado.
