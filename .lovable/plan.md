

## Diagnóstico

**Por qué se generan imágenes con DALL-E en el cotizador:**
- El menú (`/menu`) lee de la tabla `productos` de la base de datos → ya tiene `imagen_url` real (261/270 productos activos con imagen lista en el bucket `Berlioz-images`).
- El cotizador (`/cotizar`) lee de un **catálogo hardcodeado** en `src/domain/entities/BerliozCatalog.ts` y `MenuCatalog.ts` que **no tiene campos de imagen**.
- Por eso `SidebarProductCard` llama a `useProductImage` con `imagen=undefined, imagen_url=undefined` → cae al fallback que invoca `generate-product-image` (DALL-E 3) y genera imágenes nuevas cada vez (gastando crédito y devolviendo cosas inconsistentes).

**Otros problemas detectados:**
- 9 filas activas son `Order – septiembre 2019…` (basura histórica) sin categoría — hay que desactivarlas.
- Solo 94 productos `simple/variable` están activos (los 270 incluyen `variation`s). El cotizador necesita esos 94 con su descripción + imagen.

## Plan de solución (3 fases)

### Fase 1 — Limpiar y normalizar la base de datos
Migración SQL:
1. **Desactivar productos basura**: `UPDATE productos SET activo=false WHERE nombre ILIKE 'Order –%'` (9 filas viejas de WooCommerce).
2. **Backfill desde el JSON subido** (`berlioz_catalog_updated.json`):
   - Hacer match por `sku` o `nombre` normalizado.
   - Rellenar `descripcion`, `descripcion_corta` y `imagen_url` (usando `img_main` del JSON) cuando la fila de DB esté vacía.
   - Normalizar nombres a Title Case y limpiar HTML (ya hay regla en memoria).
3. **Garantizar fallback de imagen**: agregar columna/regla para que `imagen_url` nunca sea NULL en activos. Si después del backfill quedan productos activos sin imagen, asignar una **imagen genérica por categoría** (placeholder editorial) subida al bucket: `_fallback_desayuno.jpg`, `_fallback_coffee.jpg`, `_fallback_lunch.jpg`, `_fallback_bebidas.jpg`, `_fallback_default.jpg`. Esto elimina por completo cualquier llamada a DALL-E.

### Fase 2 — Unificar la fuente de verdad: cotizador lee de Supabase
1. Crear hook `useCatalogoCotizador()` (sobre `useProductos`) que devuelve los productos activos `simple/variable` mapeados al shape `CatalogProduct` que espera el cotizador, incluyendo `imagen_url`, `descripcion` y `descripcion_corta`.
2. En `src/components/quoter/ProposalStep.tsx`:
   - Reemplazar el import de `CATALOG` hardcodeado por el hook.
   - Pasar `imagen_url` y `imagen` reales a `SidebarProductCard`.
3. En `SidebarProductCard`:
   - **Eliminar `useProductImage`** (que dispara DALL-E). Usar directamente `buildProductImageUrl(imagen_url, imagen)` con un `<img onError>` que cae al fallback de categoría.
4. Aplicar el mismo cambio en `ProductBrowsePanel.tsx` y `ProductSwapModal.tsx` (también usaban catálogos hardcodeados con imágenes inconsistentes).
5. Mantener `BerliozCatalog.ts` solo para la lógica de tiers/templates (estructura de paquetes), pero los **datos de producto** (precio, imagen, descripción) vienen de Supabase haciendo lookup por nombre normalizado.

### Fase 3 — Apagar la generación con DALL-E
1. En `useProductImage.ts`: cambiar el comportamiento — si no hay imagen real, devolver el fallback de categoría en vez de invocar la edge function. La generación queda como opción manual desde admin (no automática en cada render).
2. Dejar la edge function `generate-product-image` deployada por compatibilidad pero no se llama desde la UI.

## Lo que NO se toca
- Lógica de tiers (Equilibrado/Esencial/Experiencia), totales, swap de productos, addons.
- Pasos 1 y 2 del cotizador, hero, header, footer.
- Página `/menu` (ya funciona bien con Supabase).
- PDF export (ya usa `buildProductImageUrl` correctamente).

## Resultado esperado
- Cero llamadas a DALL-E desde el cotizador.
- Mismas imágenes reales en `/menu` y en el sidebar "Cambiar/Agregar" del cotizador.
- Productos sin imagen muestran un fallback editorial limpio por categoría (no un placeholder roto, no un `animate-pulse` infinito, no una imagen IA aleatoria).
- Descripciones reales del catálogo visibles bajo cada producto en el sidebar.

