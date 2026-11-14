# Flujo de diseño: MyOrbit como app móvil

MyOrbit se usa en el celular, con una mano y en sesiones cortas entre clases. Esta guía fija **cómo** se rediseña y se corrige la interfaz para que se sienta como una app, no como una web encogida. Complementa [CONTRIBUTING.md](../CONTRIBUTING.md) (flujo de issues y PR), [PRODUCT.md](../PRODUCT.md) (a quién sirve) y [DESIGN.md](../DESIGN.md) (tokens y sistema visual).

## Herramientas

Se usan tres skills de Claude Code. Se instalan en el proyecto (`.claude/skills/`, ignorado por git; `skills-lock.json` sí se versiona para reproducir la instalación):

```bash
npx -y skills add pbakaus/impeccable --skill impeccable --agent claude-code -y
npx -y skills add emilkowalski/skill --skill emil-design-eng --agent claude-code -y
npx -y skills add sleekdotdesign/agent-skills -s sleek-design-mobile-apps --agent claude-code -y
```

Sleek además necesita la variable de entorno `SLEEK_API_KEY` (cuenta Pro o superior en sleek.design); no se guarda en el repo. Reinicia Claude Code después de instalarlas. Las skills se cargan con los permisos del agente: revisa su `SKILL.md` antes de actualizarlas.

| Skill | Para qué se usa aquí |
|---|---|
| **Impeccable** (`/impeccable`) | Estructura, jerarquía, layout, tipografía, color, copy, accesibilidad y responsive. Comandos: `critique`, `audit`, `layout`, `adapt`, `distill`, `clarify`, `harden`, `polish`. Respeta `PRODUCT.md` y `DESIGN.md` (modo **Operate**: la app es una herramienta, manda la claridad sobre la expresión). |
| **Sleek** (`sleek-design-mobile-apps`) | Genera propuestas de pantalla móvil a partir de un brief, para comparar alternativas antes de tocar código. Su salida es una **referencia visual**: se reimplementa en React con los tokens de `DESIGN.md`, nunca se pega tal cual. Solo para pantallas con cambio de estructura; los arreglos puntuales (tamaños, texto, scroll) no la necesitan. |
| **Emil Design Eng** (`emil-design-eng`) | Los detalles que hacen que la app se sienta bien: transiciones y gestos, estados táctiles, tiempos y curvas de animación, microinteracciones. |

Regla: **Sleek propone, Impeccable decide qué se ve y dónde; Emil decide cómo se mueve y responde.** Ninguna de las dos sustituye a `DESIGN.md`: si una recomendación lo contradice, se discute y, si se adopta, se actualiza `DESIGN.md` en el mismo PR.

## El ciclo por pantalla

Una pantalla (o un flujo corto) por issue y por PR. Cada una pasa por los mismos pasos:

1. **Critique y audit** (`/impeccable critique <pantalla>`, `/impeccable audit <pantalla>`): hallazgos con severidad. Se pegan en el issue.
2. **Plan** (`/impeccable shape` si cambia la estructura): qué queda a la vista, qué pasa a «bajo demanda», qué acciones suben al encabezado o a un menú. Si hay varias formas razonables de resolverlo, se piden alternativas a Sleek y se elige con Impeccable.
3. **Implementación** con `layout` / `adapt` / `clarify`, y con Emil para movimiento y estados táctiles.
4. **Verificación** en el navegador, no solo con `tsc`: 360 px y 390 px de ancho, claro y oscuro, con datos reales y con datos vacíos o largos (4 y 12 materias, títulos largos, sin conexión).
5. **Polish** (`/impeccable polish`) como última pasada antes del PR.
6. **PR** con capturas antes/después en `docs/capturas/<pantalla>/`, el resultado del audit y los criterios de cierre marcados.

## Reglas de la app móvil

Son el piso. Un PR de interfaz no se fusiona si las incumple.

- **Una mano:** las acciones frecuentes están al alcance del pulgar (barra inferior, hoja inferior); nada importante solo arriba a la izquierda.
- **Áreas táctiles ≥ 44 × 44 px** y separación suficiente entre acciones destructivas y comunes (la papelera nunca pegada a «completar»).
- **Texto ≥ 13 px**; cuerpo en 14–16 px. Sin texto truncado que oculte información clave.
- **Poco scroll:** lo importante a la vista, el detalle bajo demanda (secciones desplegables que recuerdan su estado, filas compactas que se expanden). Una pantalla de lista con 4 elementos cabe en ≤ 2 alturas de pantalla.
- **Un solo foco por pantalla:** una acción primaria clara; las secundarias en un menú o en el encabezado, no repetidas en cada tarjeta.
- **Contraste AA** en claro y oscuro, y el estado nunca depende solo del color.
- **Respeta las áreas seguras** (notch, barra de gestos) y el teclado en pantalla: los formularios no quedan tapados.
- **Estados completos:** cargando, vacío, error con reintento y sin conexión (la PWA es offline-first).
- **Movimiento con propósito:** respeta `prefers-reduced-motion`; nada bloquea la interacción; transiciones cortas (≈ 150–250 ms) y reversibles.
- **Idioma:** español de Colombia, mensajes cortos y concretos.

## Orden de trabajo

De lo más usado a lo menos, para que cada PR mejore lo que el estudiante ve todos los días. El modo oscuro (#88) se aplica pantalla por pantalla y se cierra con una pasada transversal.

1. Navegación base y Home
2. Tareas y detalle de tarea (#87, #85)
3. Agenda
4. Universidad, detalle de materia y notas (#86)
5. Hábitos
6. Perfil, Más, Notificaciones y Categorías
7. Modo oscuro, pasada transversal (#88)
8. Pasada final con Emil: transiciones entre pantallas, gestos y estados táctiles

## Auditoría inicial

Antes de la primera pantalla se hace **una** auditoría de toda la app a 360 y 390 px, claro y oscuro. Cada hallazgo se agrupa por pantalla y se convierte en issue (`feature`/`accessibility`, `area:frontend`, hito M7), enlazado a una épica «App móvil». Los hallazgos transversales (tokens, componentes compartidos, navegación) van primero, porque las pantallas se apoyan en ellos.

## Qué se versiona

- `PRODUCT.md`, `DESIGN.md` y `.impeccable/design.json`: sí. Son la fuente de verdad del diseño.
- `skills-lock.json`: sí.
- `.claude/skills/` y `.impeccable/review/` (capturas generadas): no.
- Capturas de PR en `docs/capturas/`: sí, ligeras (PNG optimizados).
