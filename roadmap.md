# Roadmap — WooCommerce como fuente de verdad

## En espera de decisión del usuario
- [ ] Entregada la lista de productos del cotizador sin match en Woo → esperando decisión (crear en Woo vs. sustituir).

## Fase 1 — Espejo fiel de Woo (pendiente de "go")
- [ ] Sync por nombre de categoría + todas las categorías del producto
- [ ] Sincronizar variantes (`/products/{id}/variations`)
- [ ] Columnas nuevas: permalink, woo_tags, en_stock, menu_order, upsell_ids, galería
- [ ] Desactivar las 176 filas del menú viejo
- [ ] Apagar el endpoint externo del backoffice (`externalCatalog.ts`)

## Fase 2 — "Realizar pedido" idéntico a berlioz.mx (pendiente)
- [ ] Categorías del menú desde Woo (7, en su orden) + Favoritos por ventas
- [ ] Selección de variante obligatoria con precio real
- [ ] Producto, carrito y checkout leyendo el espejo

## Fase 3 — Cotizador (BLOQUEADA hasta validación del menú por el usuario)
- [ ] Resolver de catálogo Woo en `quote-orchestrator` (sin tocar reglas)
- [ ] Tabla de roles/restricciones → woo_id
- [ ] Upsell y cross-sell con candidatos de Woo

## Fase 4 — Validación
- [ ] Comparación categoría por categoría contra berlioz.mx
- [ ] Cotizaciones de prueba (3 tipos de evento × 5/20/60 personas × con y sin restricciones)
- [ ] Flujo completo de pedido
