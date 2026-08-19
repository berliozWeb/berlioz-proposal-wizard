# Menú de "Realizar pedido" leyendo de la tabla sincronizada de WooCommerce

## Objetivo
Que `/menu` use como fuente de verdad la tabla de productos que `woo-catalog-sync` ya mantiene sincronizada con WooCommerce (sin llamadas en vivo a la API de Woo durante el render), con estas pestañas en este orden:

**Favoritos (default) | Working Lunch | Desayuno | Coffee Break | Bebidas | Tortas Piropo | Entrega Especial**

- Favoritos = top 8 productos por ventas totales de Woo (`total_sales`). Criterio único, límite duro de 8.
- Sin sección de restricciones alimentarias en esta fase.
- Sin pestaña "Sin categoría": los productos sin categoría no se muestran.

## Lo que existe hoy (verificado)
- `/menu` (`src/pages/CatalogPage.tsx`) lee un feed curado externo con 5 categorías (Desayuno, Coffee Break, Comida, Torta Piropo, Bebida); Working Lunch, Tortas Piropo y Entrega Especial no existen como tal ahí.
- La tabla local `productos` tiene 289 filas, de las cuales 110 vienen de Woo (`woo_source = true`). Las categorías están duplicadas/inconsistentes: convive "Coffee-break" (Woo) con "Coffee Break" (local), "Comida" (Woo) con "Working Lunch" (local), "Tortas-piropo" con "Tortas Piropo", etc.
- La tabla `productos` no tiene columna de ventas totales, así que hoy no se puede calcular Favoritos por `total_sales`.

## Cambios propuestos

### 1. Base de datos
Agregar a `productos` dos columnas que hoy faltan:
- ventas totales acumuladas del producto en Woo
- id numérico de Woo (para trazabilidad del sync)

### 2. `woo-catalog-sync` (edge function)
- Guardar las ventas totales que Woo ya devuelve en cada producto.
- Normalizar el nombre de categoría a un valor canónico único por categoría de Woo, para eliminar los duplicados ("Coffee-break" → Coffee Break, "Comida" → Working Lunch, "Tortas-piropo" → Tortas Piropo, "Entrega-especial" → Entrega Especial, "Vegano-vegetariano" → Vegano / Vegetariano).
- Limpieza única de las filas Woo ya existentes para que queden con las categorías canónicas.
- Ejecutar el sync una vez para poblar ventas y categorías normalizadas.

### 3. Nuevo hook `useMenuCatalogo`
Lee directamente la tabla `productos` (una sola consulta, cero llamadas a Woo):
- solo productos activos y de origen Woo, tipo simple o variable
- descarta los que no tienen categoría
- expone: productos por categoría (en el orden pedido), y la lista de Favoritos = top 8 por ventas totales

### 4. `src/pages/CatalogPage.tsx`
- Cambia su fuente de datos al nuevo hook.
- Pestañas en el orden final indicado, con Favoritos activo por defecto; una categoría se oculta si no tiene productos.
- Se elimina la fila de filtros de restricciones alimentarias.
- Tarjetas, selector de variantes, buscador, contador de invitados y carrito siguen funcionando igual: solo cambia el origen de los datos.

## DO NOT TOUCH
No se modifica nada del cotizador ni de sus dependencias: `useMenuCotizador`, `useSmartQuote`, `QuotePage`, `ProposalStep`, `InlineUpsell`, `UpsellModal`, `VariantPickerModal`, `quote-orchestrator`, `get-upsell-recommendations`, `BerliozCatalog`, `MenuCatalog`, ni los PDFs (`pdfTemplate.ts`, `multiDeliveryPdf.ts`).
Tampoco se toca `useProductos` / `externalCatalog.ts`, que otras páginas siguen usando.

## Notas técnicas
- Todo el orden y filtrado de pestañas vive en la capa de presentación; precios, categorías y ventas vienen tal cual de Woo vía la tabla sincronizada.
- Las banderas dietéticas se dejan para una fase posterior, con datos verificados en base.
