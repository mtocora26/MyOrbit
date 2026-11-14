# MyOrbit

App móvil hibrida para estudiantes universitarios (Colombia): tareas con subtareas, agenda, materias y notas por corte, hábitos, notificaciones. Se usa **en el celular, con una mano, en sesiones cortas**. La interfaz es solo en español.

- `backend/`: Spring Boot 4, Java 21, MongoDB. API REST bajo `/api`.
- `frontend/`: React 19, Vite 8, Tailwind 4, TypeScript, PWA. Sin librería de componentes ni router: `App.tsx` maneja pestañas y subpantallas por estado.

Lee primero lo que corresponda al cambio: [CONTRIBUTING.md](CONTRIBUTING.md) (flujo), [PRODUCT.md](PRODUCT.md) y [DESIGN.md](DESIGN.md) (producto y sistema visual), [docs/DISENO_MOVIL.md](docs/DISENO_MOVIL.md) (cambios de interfaz), [docs/BUENAS_PRACTICAS.md](docs/BUENAS_PRACTICAS.md) y [ARQUITECTURA_Y_PATRONES.md](ARQUITECTURA_Y_PATRONES.md) (backend), [docs/API.md](docs/API.md).

## Comandos

```bash
# Backend (desde backend/)
./mvnw spring-boot:run     # :8080, lee application-local.properties
./mvnw test                # los tests de integración necesitan Docker (Testcontainers)

# Frontend (desde frontend/)
pnpm dev                   # :8443, /api va al backend (VITE_DEV_API_TARGET)
pnpm typecheck             # CI también corre pnpm build
```

No hay tests de frontend: la verificación es `pnpm typecheck` y mirar la pantalla en el navegador.

## Flujo de trabajo (obligatorio)

- **Un issue, una rama, un PR a `main`**, squash. Ramas `feat|fix|refactor|docs|chore/<tema>-<n>` desde `main` actualizado.
- Commits `tipo(área): descripción (#issue)`, en español. Un issue no se mezcla con otro.
- El PR lleva `Closes #n` y, si hay épica, `Parte de la épica #n`. Backend **y** frontend si el cambio se ve; `docs/API.md` si cambia la API.
- Los issues de una épica se trabajan **en el orden** que la épica lista. La épica móvil es #173.
- No hagas push ni abras PR sin que el usuario lo haya pedido en esa conversación.

## Interfaz móvil

Cualquier cambio visual sigue `docs/DISENO_MOVIL.md`. Lo que más se incumple:

- Controles táctiles **≥ 44 × 44 px** (medido, no supuesto), texto **≥ 13 px**, áreas seguras y teclado respetados.
- Poco scroll: lo importante a la vista, el detalle bajo demanda. Un foco primario por pantalla.
- Estados completos (cargando, vacío, error con reintento, sin conexión) y `prefers-reduced-motion`.
- Se verifica a **360 y 390 px, en claro y oscuro**, con datos vacíos y largos. Capturas antes/después en `docs/capturas/<pantalla>/`.
- Usa los tokens de `DESIGN.md` (clases como `bg-card`, `text-ink-2`, `border-line`, `coral`). Sin colores sueltos, sin sombras ni degradados (lenguaje «red de rutas»).
- Componentes compartidos en `frontend/src/components/shared.tsx`: arregla ahí antes que en cada pantalla. En flex, los controles de 44 px llevan `flex-shrink-0` o se encogen.

Skills del proyecto (`.claude/skills/`, ignoradas por git; `skills-lock.json` sí se versiona):

| Skill | Úsala para |
|---|---|
| `impeccable` | Qué se ve y dónde: `critique`, `audit`, `adapt`, `layout`, `polish`. Modo Operate: manda la claridad. |
| `emil-design-eng` | Cómo se mueve y responde: transiciones, estados táctiles, microinteracciones. |
| `sleek-design-mobile-apps` | Alternativas de pantalla **solo cuando cambia la estructura** (p. ej. #87, #86, #170). Es referencia visual, se reimplementa con los tokens. Necesita `SLEEK_API_KEY`. |

## Backend

- Package-by-feature con capas: `api → application → domain ← infrastructure`. El dominio no conoce Spring ni Mongo. Un módulo no usa el repositorio de otro: llama a su servicio de aplicación.
- Controllers solo traducen HTTP; la propiedad del recurso se verifica en el servicio (`getOwned(userId, id)`). Errores como `ProblemDetail`.
- Los enums viajan distinto a cada lado: `HabitType` es `BUILD`/`QUIT` y `HabitFrequency` es `diaria`/`personalizada` en JSON.
- Sin `System.out`, sin código comentado, sin credenciales.

## Entorno local (gotchas)

- Windows. Usa rutas con `/` en Bash y no dependas de `mongod`: **no hay Mongo local**.
- `backend/application-local.properties` (ignorado) apunta a **MongoDB Atlas con datos reales**. No crees ni borres datos en esa base sin avisar; si necesitas una sesión de prueba, registra una cuenta desechable `qdtest.<n>@example.com` y anótala para borrarla.
- El backend (:8080) y el frontend (:8443) suelen estar ya corriendo. Comprueba con `netstat` antes de levantar otro.
- `SLEEK_API_KEY` vive en `.claude/settings.local.json` (ignorado). Nunca la escribas en archivos versionados ni en commits.
- Fines de línea: git avisa de LF→CRLF; es normal en este equipo, no los «arregles».
