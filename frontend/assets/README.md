# Recursos nativos (Capacitor)

Fuentes para generar íconos y splash de Android/iOS con `@capacitor/assets`, que lee esta carpeta por convención.

| Archivo | Tamaño | Qué es |
| --- | --- | --- |
| `icon-only.png` | 1024×1024 | Ícono completo, placa coral a sangre con el glifo night (iOS y Android antiguo). |
| `icon-foreground.png` | 1024×1024 | Solo el glifo, fondo transparente, dentro de la zona segura (ícono adaptativo de Android). |
| `icon-background.png` | 1024×1024 | Coral sólido `#FF6B4A` (fondo del ícono adaptativo). |
| `splash.png` | 2732×2732 | Ícono centrado sobre `paper` `#EEF1F6`. |
| `splash-dark.png` | 2732×2732 | Ícono centrado sobre `paper-dark` `#0A111F`. |

Cuando Capacitor esté inicializado en `frontend/`:

```bash
pnpm add -D @capacitor/assets
pnpm exec capacitor-assets generate
```

El logo es la **órbita de ruta**: ver `docs/brand/` y la sección Logo de `DESIGN.md`. No edites estos PNG a mano; si el logo cambia, regenéralos desde los SVG de `docs/brand/`.
