## Qué cambia

<!-- Resumen breve -->

Closes #

## Tipo
- [ ] feat
- [ ] fix
- [ ] refactor
- [ ] test / docs / chore

## Checklist ([BUENAS_PRACTICAS.md](../docs/BUENAS_PRACTICAS.md))
- [ ] Respeta las capas (`api → application → domain ← infrastructure`)
- [ ] Cada clase tiene una sola responsabilidad (SRP); controllers sin lógica de negocio
- [ ] Sin strings mágicos: enums o constantes (OCP)
- [ ] Dependencias inyectadas por constructor, sin `new` de servicios externos (DIP)
- [ ] DTOs en la API, sin exponer entidades
- [ ] Errores con excepciones de dominio; ningún servicio retorna `null` como error
- [ ] Validación con Bean Validation en los requests
- [ ] Tests nuevos o actualizados y pasando
- [ ] Sin credenciales, `System.out` ni código comentado

## Cómo probarlo

<!-- Pasos, requests de ejemplo, capturas -->
