# Menú de "Realizar pedido" organizado por categorías de WooCommerce

## Objetivo
Que `/menu` use WooCommerce como única fuente de verdad y muestre las divisiones en este orden:

1. **Favoritos** (prioritario, pestaña inicial)
2. Working Lunch
3. Desayuno
4. Coffee Break
5. Bebidas
6. Tortas Piropo
7. Entrega Especial
8. Sin categoría
9. **Restricciones alimentarias**: Vegetariano, Vegano, Sin lactosa, Keto, Sin gluten

El cotizador (`/cotizar`) no se toca.

## Lo que existe hoy
`/menu` (`src/pages/CatalogPage.tsx`) lee un feed curado externo con solo 5 categorías (Desayuno, Coffee Break, Comida, Torta Piropo, Bebida), así que Tortas Piropo, Entrega Especial, Working Lunch y Sin categoría no aparecen como tales. Los "Favoritos" se calculan con un segundo feed cuyo campo `destacado` no coincide con Woo.

En WooCommerce las categorías reales son: Working Lunch (30), Coffee Break (36), Desayuno (21), Bebidas (16), Vegano / Vegetariano (14), Tortas Piropo (7), Entrega Especial (5), Sin categoría (1). Las etiquetas de Woo no traen información dietética (solo tipos de producto), así que las restricciones se resolverán como se explica abajo.

## Cambios propuestos

### 1. Nueva función de backend `woo-menu`
Lee productos directamente de WooCommerce por el gateway ya conectado (misma credencial que usa `woo-catalog-sync`) y devuelve para cada producto:
- id de Woo, nombre, descripciones, imagen y galería
- precio y variantes (con precio y opción por variante)
- **categoría real de Woo** (slug + nombre), incluyendo "Sin categoría"
- `favorito`: destacado en Woo o dentro de los más vendidos (`total_sales`)
- `dietary`: banderas `vegetariano / vegano / keto / sin_gluten / sin_lactosa`

Origen de las banderas dietéticas (en este orden):
1. Pertenecer a la categoría de Woo "Vegano / Vegetariano"
2. Datos dietéticos del feed curado ya existente, cruzados por id de Woo (ahí sí están vegano/vegetariano/keto/sin gluten/sin lactosa por variante)

Solo se muestran productos publicados y visibles en la tienda; respuesta cacheada unos minutos para que la página cargue rápido.

### 2. Hook nuevo `useWooMenu`
Consume `woo-menu` con React Query y expone: lista de productos, categorías presentes (en el orden pedido) y helpers de filtro por categoría y por restricción.

### 3. `src/pages/CatalogPage.tsx`
- Cambia su fuente de datos al nuevo hook (deja de usar el feed del cotizador y el feed de `destacado`).
- Barra de pestañas en el orden pedido, con **Favoritos** primero y activo por defecto, luego las 7 categorías de Woo (solo si tienen productos) y al final un grupo visualmente separado de **Restricciones alimentarias** con las 5 opciones.
- Las tarjetas de producto, el selector de variantes, el contador de invitados y el carrito siguen funcionando igual; solo cambia de dónde vienen los datos.
- Si Favoritos quedara vacío, cae automáticamente a Working Lunch.

## Notas técnicas
- Nada de esto toca `/cotizar`: no se modifican `useMenuCotizador`, `useSmartQuote`, `ProposalStep`, `QuotePage`, `quote-orchestrator` ni `BerliozCatalog`.
- `useProductos` / `get-catalog` siguen usándose en otras páginas; no se alteran.
- "Bebidas" aparecía dos veces en la lista pedida: se muestra una sola vez.
- Todo el filtrado y el orden viven en la capa de presentación; los precios y categorías vienen tal cual de WooCommerce.
