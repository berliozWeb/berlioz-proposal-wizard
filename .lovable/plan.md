

# Plan: Knowledge Base de Ventas + Fix de Imágenes Faltantes

## Diagnóstico

### Imágenes — ¿Por qué no se generan con DALL-E?
Las imágenes en las propuestas **SÍ funcionan**. Verifiqué con una llamada real al orchestrator: los 3 paquetes regresan `imageUrl` con URLs válidas del bucket `Berlioz-images`. De 270 productos activos, **232 ya tienen `imagen_url`** en la base de datos. Los 38 restantes son **variaciones** con `parent_id` — el orchestrator ya hereda la imagen del padre vía `resolveImage()`.

La Edge Function `generate-product-image` (DALL-E) tiene **0 registros en cache** porque nunca ha sido invocada — el flujo nunca llega al paso 3 (DALL-E) porque el paso 2 (imagen del padre) siempre resuelve.

**El hook `useProductImage` no se usa** en el mosaic ni en las item rows de ProposalStep. Las imágenes se pasan directamente via `item.imageUrl` desde el orchestrator. Esto es correcto y más eficiente.

### Lo que SÍ necesita arreglo
1. **38 variaciones sin imagen propia** — Algunas de estas variaciones tienen padres que TAMPOCO tienen imagen (edge case). Necesitamos verificar y rellenar desde el Excel.
2. **No hay base de conocimiento de ventas** — Claude solo usa el feedback del cotizador (que aún tiene pocos datos). Las 121K+ líneas de órdenes reales de 2025 son oro puro para mejorar las recomendaciones.
3. **Las imágenes del Excel maestro** no se han sincronizado con la DB — el Excel tiene URLs de galería normalizadas que podrían llenar los 38 huecos.

## Cambios Propuestos

### PARTE 1 — Ingestar imágenes del catálogo maestro Excel (38 faltantes)

1. Leer el Excel con pandas, extraer columnas: `ID`, `Imagen_1_URL`, `Parent_ID`
2. Para los 38 productos sin imagen:
   - Si el Excel tiene URL de imagen → actualizar `imagen_url` en `productos` via migration/insert
   - Si no tiene imagen pero tiene padre con imagen → copiar la URL del padre
   - Si absolutamente no hay imagen → dejar que DALL-E genere (el pipeline ya existe)
3. Script Python para procesar y generar los SQL INSERT/UPDATE statements

### PARTE 2 — Crear tabla `sales_history` para knowledge base

Crear una nueva tabla para almacenar el historial de ventas agregado:

```sql
CREATE TABLE sales_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  product_sku text,
  product_id text,
  categoria text,
  total_qty_sold integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  unique_companies integer DEFAULT 0,
  avg_order_size numeric DEFAULT 0,
  top_companies text[],
  top_zip_codes text[],
  peak_months text[],
  common_time_slots text[],
  created_at timestamptz DEFAULT now()
);
```

Procesar el CSV de 121K líneas con Python/pandas:
- Agrupar por producto: cantidad total vendida, revenue, empresas únicas
- Extraer patrones: meses pico, horarios más solicitados, CPs frecuentes
- Insertar datos agregados en `sales_history`

### PARTE 3 — Inyectar historial de ventas en el prompt de Claude

Modificar `quote-orchestrator` para:
1. Consultar `sales_history` filtrando por categoría relevante al evento
2. Añadir al prompt de Claude una sección:

```
DATOS DE VENTAS REALES 2025 (${totalOrders} pedidos):
Los productos más vendidos para esta categoría son:
- PINK BOX: 2,340 unidades, $842K revenue, pedido por 180 empresas
- SALMON BOX: 1,890 unidades, frecuente en horario 12:00-14:00
...
Prioriza estos productos probados por el mercado.
```

### PARTE 4 — Verificar que DALL-E se active para los pocos sin imagen

Asegurar que el `useProductImage` hook se use como fallback en las item rows cuando `imageUrl` sea null después de todos los pasos de resolución. Actualmente el hook existe pero no se invoca en ProposalStep (las imágenes vienen directo del orchestrator, lo cual es correcto para el 97% de los casos).

## Archivos a crear/modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/xxx_sales_history.sql` | Nueva tabla `sales_history` + RLS |
| Script Python (temporal) | Procesar CSV → insertar en `sales_history` |
| Script Python (temporal) | Procesar Excel → actualizar `imagen_url` en 38 productos |
| `supabase/functions/quote-orchestrator/index.ts` | Consultar `sales_history` e inyectar en prompt de Claude |

## Lo que NO se toca
- BusinessRules.ts, IVA, envío, cut-off, mínimos
- Controles de cantidad, swap, cross-sell, add-ons
- Sticky bar, wizard, routing, auth
- Cálculos de precios

