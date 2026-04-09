

## Plan: Favoritos basados en datos reales de ventas + nueva estructura de categorías

### Problema
La vista de "Realizar Pedido" no prioriza los productos más vendidos. El usuario quiere que la vista por defecto sea "Favoritos" (basado en datos reales de 121K+ órdenes), y reorganizar las categorías del filtro.

### Enfoque

**1. Importar datos del CSV a la tabla `sales_history` existente (o usarla directamente)**

La tabla `sales_history` ya tiene 218 productos con `total_qty_sold` y `total_revenue`. Esto ya representa los favoritos. No necesitamos re-importar el CSV — los datos ya están ahí.

**2. Crear una columna `popularity_rank` en `productos`**

Agregar un campo numérico `popularity_rank` a la tabla `productos` y llenarlo con un ranking basado en `sales_history.total_qty_sold`, haciendo match por nombre o SKU. Los productos sin ventas quedan con rank NULL (no son favoritos).

Migración SQL:
- `ALTER TABLE productos ADD COLUMN popularity_rank smallint DEFAULT NULL`
- `UPDATE productos SET popularity_rank = ...` usando JOIN con `sales_history` ordenado por `total_qty_sold DESC`

**3. Reorganizar los filtros de categoría en `CatalogPage.tsx`**

Nuevo orden de pills:
| Filtro | Lógica |
|--------|--------|
| ⭐ Favoritos (default) | `popularity_rank IS NOT NULL`, ordenar por `popularity_rank ASC` |
| 🍽️ Todos | Sin filtro |
| ☕ Coffee Break | `categoria = 'Coffee Break'` |
| 🍱 Working Lunch | `categoria = 'Working Lunch'` |
| 🍳 Desayuno | `categoria = 'Desayuno'` |
| 🥤 Bebidas | `categoria = 'Bebidas'` |
| 🌱 Vegano/Vegetariano | `dietary_tags` contiene 'vegano' o 'vegetariano' |
| 🥑 Keto | `dietary_tags` contiene 'keto' |
| 🥖 Tortas Piropo | `categoria = 'Tortas Piropo'` |
| 🎁 Entrega Especial | `categoria = 'Entrega Especial'` |

**4. Modificar `useProductos` y `CatalogPage`**

- El estado inicial del filtro será `"favoritos"` en vez de `"todos"`
- Cuando el filtro es "favoritos", filtrar por `popularity_rank NOT NULL` y ordenar por rank
- Actualizar el array `CATEGORY_FILTERS` con el nuevo orden

### Archivos a modificar
- **Migración SQL**: agregar `popularity_rank` y poblarla desde `sales_history`
- **`src/pages/CatalogPage.tsx`**: reordenar filtros, default a favoritos, lógica de filtrado por rank
- **`src/hooks/useProductos.ts`**: (posiblemente) agregar soporte para ordenar por popularity_rank

### Resultado
Al entrar a "/menu", el usuario ve primero los ~50 productos más vendidos según datos reales, con un badge de popularidad. Puede cambiar a cualquier otra categoría con un click.

