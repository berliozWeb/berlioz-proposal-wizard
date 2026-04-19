
User wants two changes to the tier rows in ProposalStep.tsx:
1. The price breakdown (Zona C) feels visually disconnected — make it look like it belongs inside the main tier container.
2. Add a visual affordance on the product carousel (Zona B) showing more cards exist horizontally — arrows and/or a scroll indicator.

Both are pure UI tweaks within the existing tier row block (~lines 644+). No logic changes.

## Plan

### 1. Desglose dentro del contenedor (Zona C)
Actualmente la Zona C tiene su propio `bg-[#FDFAF7] rounded-xl` que la hace ver como una "tarjeta dentro de la tarjeta". Cambios:
- Quitar el fondo crema y border-radius propios de Zona C
- Añadir un divisor vertical sutil entre Zona B y Zona C (`border-l border-border/40 pl-6`)
- Mantener tipografía y jerarquía igual (Subtotal / Logística / IVA / TOTAL)
- El TOTAL queda visualmente integrado como parte del mismo card blanco del tier

### 2. Indicador de scroll horizontal en el carrusel (Zona B)
- **Flechas laterales** ‹ › : botones circulares blancos con sombra, posicionados absolute sobre los bordes izquierdo/derecho del scroll. Solo visibles en desktop (`hidden lg:flex`). Hacen `scrollBy({ left: ±200, behavior: 'smooth' })` sobre el ref del contenedor scrollable.
- **Fade gradient en los bordes**: pseudo-elementos con `bg-gradient-to-r from-white` a la derecha y `from-white` invertido a la izquierda, indicando que hay contenido cortado.
- **Scrollbar visible y estilizada**: cambiar `pb-2` a una scrollbar fina visible (track gris claro, thumb navy) usando utilidades tailwind o estilos inline.
- Las flechas se ocultan automáticamente cuando no hay overflow (detectar con `scrollWidth > clientWidth` en un useEffect ligero por tier).

### Archivo afectado
- `src/components/quoter/ProposalStep.tsx` — solo el bloque de cada tier row (Zona B y Zona C). Sin tocar handlers, cálculos ni el resto del archivo.

### Lo que NO se toca
- Lógica de `tierTotals`, `updateItemQty`, `removeItem`, `openSwapSidebar`
- Zona A (identificación del tier) ni el resto del Step 3
- Steps 1 y 2, header, footer, Edge Functions
