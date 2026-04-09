

## Problema

Los overlays del carrusel tienen opacidades muy altas (0.30–0.55) con colores oscuros, lo que apaga las imágenes y les quita vida. El slide de Piropo es el peor con `rgba(5, 15, 20, 0.55)`.

## Solución

Reducir la opacidad de cada overlay significativamente y usar tonos más claros/cálidos para mantener legibilidad del texto sin oscurecer tanto las fotos. Además, reforzar el `textShadow` del texto para que siga siendo legible sin depender tanto del overlay.

### Cambios en `src/components/landing/HeroCarousel.tsx`

**Overlays más ligeros:**
| Slide | Antes | Después |
|-------|-------|---------|
| Catering | `rgba(1, 77, 111, 0.45)` | `rgba(1, 77, 111, 0.22)` |
| Ingredientes | `rgba(80, 60, 100, 0.35)` | `rgba(80, 60, 100, 0.18)` |
| Empaques | `rgba(1, 77, 111, 0.40)` | `rgba(1, 77, 111, 0.20)` |
| Green Box | `rgba(20, 40, 30, 0.30)` | `rgba(20, 40, 30, 0.15)` |
| Lunch Box | `rgba(30, 20, 10, 0.35)` | `rgba(30, 20, 10, 0.18)` |
| Piropo | `rgba(5, 15, 20, 0.55)` | `rgba(5, 15, 20, 0.25)` |

**Texto más legible sin overlay pesado:**
- Aumentar `textShadow` en line1 a `0 2px 24px rgba(0,0,0,0.6), 0 1px 6px rgba(0,0,0,0.4)`
- Aumentar `textShadow` en line2 a `0 2px 16px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3)`

Esto deja que las fotos brillen con mucha más luz y color, mientras el texto sigue siendo perfectamente legible gracias al shadow más fuerte.

