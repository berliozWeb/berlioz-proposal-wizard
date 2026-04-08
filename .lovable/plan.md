
# Plan: Imágenes en Propuestas + IA para Aprendizaje del Cotizador

## Diagnóstico

### 1. Imágenes NO se muestran en las propuestas
El orchestrator backend SÍ resuelve `imageUrl` por producto y lo envía al frontend. El hook `useSmartQuote` lo pasa. `ProposalStep.tsx` lo recibe en `item.imageUrl`. **Pero el render de cada item (líneas 582-624) NO renderiza ninguna imagen** — solo muestra nombre, precio, razón y controles de cantidad. Las imágenes están disponibles pero no se pintan.

### 2. No hay IA real
El `quote-orchestrator` usa scoring heurístico puro (reglas if/else). La edge function `get-quote` SÍ usa Lovable AI (Gemini) pero NO está conectada al flujo `/cotizar` — es un endpoint legacy sin uso. No hay aprendizaje ni retroalimentación.

### 3. No hay aprendizaje
La tabla `quote_feedback` existe pero nunca se escribe. No hay loop de retroalimentación.

---

## Plan de Implementación

### Parte A — Imágenes en las propuestas (UI)

**Archivo: `src/components/quoter/ProposalStep.tsx`**

Modificar el render de cada item dentro del menú expandible (línea ~582) para mostrar la imagen del producto:
- Agregar un thumbnail de 56x56px a la izquierda de cada item
- Si `item.imageUrl` existe, mostrar `<img>` con `object-cover` y bordes redondeados
- Si no existe, mostrar un emoji/icono placeholder (🍱) con fondo suave
- Mantener el layout responsivo actual

### Parte B — Collage de imágenes por paquete

Usar el componente `ProductCollage.tsx` que ya existe pero NO se usa en ProposalStep:
- Agregar un collage con las primeras 3-4 imágenes de cada paquete en la parte superior de cada card de tier
- Esto le da una identidad visual a cada propuesta

### Parte C — IA para el cotizador inteligente

Tienes varias opciones de IA disponibles sin necesidad de API keys adicionales:

| Opción | Modelo | Ventaja | Desventaja |
|--------|--------|---------|------------|
| **A. Scoring con IA** | `gemini-3-flash-preview` | Rápido, barato, el modelo evalúa contexto del evento y selecciona productos óptimos | Latencia ~2-4s |
| **B. Composición con IA** | `gemini-2.5-flash` | El modelo arma los 3 paquetes completos usando el catálogo real como contexto | Latencia ~3-5s |
| **C. IA + Aprendizaje** | `gemini-3-flash-preview` + feedback loop | Opción B + el sistema guarda qué eligen los usuarios y retroalimenta el prompt con datos históricos | Más complejo pero aprende |

**Recomendación: Opción C** — IA completa con aprendizaje progresivo.

#### Implementación de Opción C:

1. **Evolucionar `quote-orchestrator`**:
   - Después del retrieval de productos (que ya funciona bien), enviar los candidatos como contexto a Lovable AI
   - El modelo recibe: productos candidatos + contexto del evento + historial de feedback agregado
   - El modelo devuelve: composición óptima de los 3 paquetes con razones
   - Si la IA falla → fallback al scoring heurístico actual (ya existe)

2. **Feedback loop** — Guardar decisiones del usuario:
   - Al seleccionar un tier → escribir en `quote_feedback` el tier elegido
   - Al agregar/quitar productos → registrar cambios
   - Al confirmar pedido → marcar como aceptado
   - Crear un endpoint `quote-feedback` edge function

3. **Aprendizaje progresivo**:
   - Crear una vista SQL `popular_products_by_event` que agregue: qué productos se seleccionan más por tipo de evento, presupuesto y tamaño de grupo
   - Inyectar este resumen en el prompt del modelo como "historial de preferencias"
   - El modelo usa esto para mejorar sus recomendaciones

### Parte D — Generación de imágenes con IA (opcional/futuro)

Para productos sin imagen, el orchestrator ya genera `imagePrompt`. Se puede conectar a `gemini-3.1-flash-image-preview` para generar la imagen y guardarla en storage. Esto se puede hacer como fase 2.

---

## Archivos a crear/modificar

| Archivo | Acción |
|---------|--------|
| `src/components/quoter/ProposalStep.tsx` | Agregar imágenes en items y collage en cards |
| `supabase/functions/quote-orchestrator/index.ts` | Integrar Lovable AI para composición inteligente |
| `supabase/functions/quote-feedback/index.ts` | Nuevo — guardar feedback del usuario |
| Migración SQL | Vista `popular_products_by_event` para aprendizaje |
| `src/hooks/useSmartQuote.ts` | Agregar función `submitFeedback` |
| `src/components/quoter/ProposalStep.tsx` | Conectar feedback al seleccionar tier / modificar items |

## Flujo resultante

```text
Usuario llena wizard → QuotePage invoca quote-orchestrator
                              ↓
                    Retrieval de productos (RPC actual)
                              ↓
                    Consulta historial de preferencias (vista SQL)
                              ↓
                    Lovable AI compone 3 paquetes con contexto + historial
                              ↓
                    Fallback a heurístico si IA falla
                              ↓
                    ProposalStep muestra paquetes CON IMÁGENES
                              ↓
                    Usuario selecciona/modifica → feedback se guarda
                              ↓
                    El sistema aprende para la próxima cotización
```
