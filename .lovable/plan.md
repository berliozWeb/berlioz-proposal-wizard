
# Migrar el catálogo de productos al Quote Builder externo

## Objetivo
Reemplazar todas las lecturas de la tabla local `productos` por un fetch a:
`https://rrfvdhegvgmejxmsdijn.supabase.co/functions/v1/get-catalog`

Sin tocar el cotizador, el formulario de contacto, el diseño ni otras secciones — solo la fuente de datos.

## Lugares donde hoy se lee `productos` (auditoría)
1. `src/hooks/useProductos.ts` → hook raíz que hace `supabase.from('productos')`. Lo consumen:
   - `src/pages/CatalogPage.tsx` (página de catálogo público)
   - `src/hooks/useCatalogoCotizador.ts` → consumido por `ProposalStep.tsx` (cotizador)
2. `src/pages/ProductDetailPage.tsx` → query directo `supabase.from('productos').select(...).eq('id', slug)`

> Nota: el cotizador consume el catálogo a través de `useCatalogoCotizador` → `useProductos`. Cambiar la fuente en `useProductos` cumple el requisito sin tocar la UI ni la lógica del cotizador (solo cambia de dónde llegan los datos).

## Estrategia
**Punto único de cambio**: reescribir `useProductos` para que internamente llame a la edge function externa, cachee el resultado en memoria (singleton) y mapee cada producto remoto al tipo local `Producto` para no romper a ningún consumidor.

## Cambios

### 1. Nuevo módulo `src/lib/externalCatalog.ts`
- `fetchExternalCatalog()`: hace `fetch` a la URL, devuelve `Producto[]` ya mapeado.
- Cache en memoria (`let cache: Promise<Producto[]> | null`) para evitar refetch en cada hook.
- Función `mapRemoteToProducto(remote)` con este mapping:

| Remoto                       | Local (`Producto`)                |
|------------------------------|-----------------------------------|
| `id`, `sku`, `nombre`        | iguales                           |
| `descripcion_larga`          | `descripcion`                     |
| `descripcion_corta`          | `descripcion_corta`               |
| `precio_base`                | `precio` y `precio_min`           |
| `precio_max`                 | `precio_max`                      |
| `categoria`                  | `categoria`                       |
| `imagen_url`                 | `imagen_url` (`imagen` = null)    |
| `tags[]`                     | `dietary_tags`                    |
| `visible_en_web && activo`   | `activo`                          |
| —                            | `tipo: 'simple'`, `parent_id: null`, `destacado: false`, `orden: 0`, `popularity_rank: null`, `variantes: null`, `precio_rebajado: null`, `variante_nombre: null`, `created_at: null` |

### 2. Reescribir `src/hooks/useProductos.ts`
- Mantener la firma pública (`useProductos`, `useMenuProductos`, `useCatalogoCompleto`, `useVariantes`, interfaz `Producto`, `Filters`).
- Internamente: `useEffect` con `fetchExternalCatalog()`, aplicar los mismos filtros (`activo`, `categoria`, `tipo`, `parent_id`) en memoria sobre el array mapeado.
- Estados: `loading: true` mientras carga, `error: string | null` cuando falla. Añadir `error` al return (no rompe consumidores que solo desestructuran `productos`/`loading`).
- `useVariantes` queda devolviendo `[]` (la API externa no expone variations, no se usa en producción crítica).

### 3. `src/pages/ProductDetailPage.tsx`
Reemplazar el bloque `else { supabase.from('productos')... }` por:
```ts
const all = await fetchExternalCatalog();
const data = all.find(p => p.id === slug);
```
y construir el `setProduct({...})` con los mismos campos que ya usa hoy. Mantener el fallback a `findProduct(slug)` del catálogo local que ya existe arriba.

### 4. UX de loading / error
- `useProductos` ya expone `loading` (lo usan `CatalogPage` y `useCatalogoCotizador`). No hace falta cambiar UI: ya muestran skeletons.
- Añadir banner de error elegante en `CatalogPage` cuando `error` esté presente: card centrada con texto "No pudimos cargar el catálogo. Intenta de nuevo." y botón "Reintentar" que limpia el cache y refetch.
- En `ProductDetailPage`, si el fetch falla y no hay producto local, mantener el actual estado "Producto no encontrado" con CTA de regreso.

## Archivos a modificar
- `src/lib/externalCatalog.ts` (nuevo)
- `src/hooks/useProductos.ts` (reescritura interna, API pública intacta)
- `src/pages/ProductDetailPage.tsx` (reemplazar query directo)
- `src/pages/CatalogPage.tsx` (añadir estado de error)

## Lo que NO se toca
- `src/components/quoter/ProposalStep.tsx` y todo el cotizador
- `src/components/landing/CotizaForm.tsx` y formulario de contacto
- Edge function `quote-orchestrator` (sigue leyendo `productos` server-side; está fuera del alcance porque corre en el backend de este proyecto y el usuario pidió solo cambios de fuente en lectura cliente)
- Diseño visual, rutas, layout

## Detalles técnicos
- La edge function externa es pública (no requiere auth). Fetch directo con `fetch(URL)` sin headers de auth.
- Cache TTL: una sola carga por sesión del navegador (suficiente; al recargar se refresca). Exponer `invalidateExternalCatalog()` para el botón "Reintentar".
- Tipos: definir `RemoteProduct` interno en `externalCatalog.ts` con los campos del JSON remoto. No exportar — los consumidores siguen viendo `Producto`.
