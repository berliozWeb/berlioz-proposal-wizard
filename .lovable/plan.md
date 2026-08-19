# /menu: pestañas fijas, Favoritos por ventas de Woo y paginación

## Objetivo
`/menu` lee la tabla de productos que `woo-catalog-sync` ya mantiene sincronizada (cero llamadas en vivo a Woo al renderizar), con pestañas en orden fijo, Favoritos automáticos por ventas y paginación.

Orden de pestañas:
**Favoritos (activa por defecto) | Working Lunch | Desayuno | Coffee Break | Bebidas | Tortas Piropo | Entrega Especial**

## Estado actual (verificado)
- `src/pages/CatalogPage.tsx` toma datos de `useMenuCotizador` (feed externo) y muestra filtros dietéticos.
- En la tabla `productos`, las filas de origen Woo son: Coffee-break 38, Comida 23, Bebidas 16, Desayuno 11, Vegano-vegetariano 10, Tortas-piropo 7, Entrega-especial 5. Ninguna sin categoría hoy.
- No existen columnas de ventas totales ni de id de Woo.

## Cambios

### 1. Base de datos (solo agregar columnas)
`ALTER TABLE productos ADD COLUMN` para:
- ventas totales (numérico, default 0)
- id numérico de Woo (nullable)

Sin UPDATE, sin DELETE, sin backfill, sin normalizar datos históricos.

### 2. `woo-catalog-sync`
- Guardar ventas totales e id de Woo en cada sync.
- Solo escritura hacia adelante: no reescribe categorías ni otros campos de filas existentes.
- Programar la ejecución una vez al día.

### 3. Nuevo hook `useMenuCatalogo`
Una sola consulta a `productos`:
- filtra activo, origen Woo, tipo simple o variable
- descarta productos sin categoría
- expone productos agrupados por categoría y Favoritos = top 12 por ventas totales

Mapeo de categorías **solo en presentación** (la base no se modifica): Comida → Working Lunch, Coffee-break → Coffee Break, Tortas-piropo → Tortas Piropo, Entrega-especial → Entrega Especial, Bebida/bebidas → Bebidas, Desayuno → Desayuno.

### 4. `src/pages/CatalogPage.tsx`
- Cambia su origen de datos al nuevo hook.
- Pestañas en el orden exacto indicado; una pestaña se oculta si no tiene productos.
- Favoritos: 12 productos, sin paginación. Si queda vacío, cae a Working Lunch.
- Las otras 7 pestañas: paginadas de 15 en 15.
- Se elimina la fila de restricciones alimentarias.
- Tarjetas, selector de variantes, buscador, contador de invitados y carrito funcionan igual.

Nota: las 10 filas con categoría "Vegano-vegetariano" no tienen pestaña en esta lista, así que no aparecerán en `/menu` en esta fase.

## DO NOT TOUCH
`useMenuCotizador`, `useSmartQuote`, `QuotePage`, `ProposalStep`, `InlineUpsell`, `UpsellModal`, `VariantPickerModal`, `quote-orchestrator`, `get-upsell-recommendations`, `BerliozCatalog`, `MenuCatalog`, `useCatalogoCotizador`, `pdfTemplate.ts`, `multiDeliveryPdf.ts`, `useProductos`, `externalCatalog.ts`, `src/data/shippingZones.ts`. Ningún archivo del cotizador. Ningún UPDATE a datos existentes.
