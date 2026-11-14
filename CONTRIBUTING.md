# Cómo contribuir a MyOrbit

Este documento fija el flujo de trabajo. Se aplica igual a personas y a asistentes (Claude Code).

## Flujo: un issue, una rama, un PR a `main`

1. **Todo cambio parte de un issue.** Si no existe, créalo con la plantilla que corresponda (`feature`, `bug`, `refactor`; las épicas usan `epic`). Los issues de una épica se trabajan **en el orden** que lista la épica.
2. **Una rama por issue**, creada desde `main` actualizado:
   ```bash
   git checkout main && git pull
   git checkout -b feat/<tema-corto>-<n>   # p. ej. feat/eventos-139
   ```
   Prefijos: `feat/`, `fix/`, `refactor/`, `docs/`, `chore/`. Un issue no se mezcla con otro en la misma rama.
3. **Commits** con el formato `tipo(área): descripción (#issue)`, en español, p. ej. `feat(events): eventos de uno o varios días (#139)`. Al fusionar, el PR añade su número: `... (#139) (#159)`.
4. **Abre un PR a `main`** con la plantilla del repo. Debe incluir `Closes #<issue>` y, si el issue es parte de una épica, `Parte de la épica #<n>`.
5. **Fusiona con squash** cuando CI esté en verde y la checklist del PR esté completa. Cada issue queda como **un solo commit** en `main`.
6. **Borra la rama al fusionar** (ver abajo).

### Qué debe traer cada PR

- Código del backend **y** del frontend si el cambio es visible para el usuario.
- **Tests** nuevos o actualizados (`./mvnw test` en verde; `pnpm typecheck` en el front).
- **`docs/API.md`** actualizado si cambia un endpoint, un campo o una regla.
- Respeto de [ARQUITECTURA_Y_PATRONES.md](ARQUITECTURA_Y_PATRONES.md) y [docs/BUENAS_PRACTICAS.md](docs/BUENAS_PRACTICAS.md).
- Un cambio incompatible de la API se declara en la descripción del PR.
- Sin credenciales, `System.out` ni código comentado.

### Issues que dependen de otro aún sin fusionar

Si el issue necesita código de un PR abierto, **apila** la rama sobre la de ese PR y apunta el PR a esa rama (no a `main`). Indícalo al inicio de la descripción. Cuando el PR base se fusione, cambia la base del PR apilado a `main` (GitHub lo hace solo al borrar la rama base, pero verifícalo).

## Ramas fusionadas: se borran

Una rama fusionada no se conserva: el historial ya está en `main`.

- En GitHub, activa **Settings → General → Automatically delete head branches** para que se borre sola al fusionar.
- Después de fusionar, limpia lo local:
  ```bash
  git checkout main && git pull
  git fetch --prune                    # quita las referencias remotas ya borradas
  git branch -D <rama>                 # con squash hay que usar -D: git no ve la rama como «merged»
  ```
- Para saber qué ramas ya se fusionaron por squash (`git branch --merged` no las detecta):
  ```bash
  gh pr list --state merged --json headRefName,number
  ```
- Nunca borres la rama de un PR abierto ni una rama que sirva de base de otro PR apilado.

## Registro del flujo

El historial de `main` es el registro: un commit por issue con su número, y el issue y el PR enlazados con `Closes #n`. Por eso no se hacen commits sueltos a `main` salvo correcciones de infraestructura puntuales (`fix(infra): ...`).
