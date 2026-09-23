# Roadmap — WooCommerce como fuente de verdad

## En espera de decisión del usuario
- [ ] Entregada la lista de productos del cotizador sin match en Woo → esperando decisión (crear en Woo vs. sustituir).

## Fase 1 — Espejo fiel de Woo (pendiente de "go")
- [x] Sync por nombre de categoría + todas las categorías del producto
- [x] Sincronizar variantes (`/products/{id}/variations`)
- [x] Columnas nuevas: permalink, woo_tags, en_stock, menu_order, upsell_ids, galería
- [x] Desactivar las 176 filas del menú viejo
- [x] Apagar el endpoint externo del backoffice (`externalCatalog.ts`)

## Fase 2 — "Realizar pedido" idéntico a berlioz.mx (pendiente)
- [x] Categorías del menú desde Woo (7, en su orden) + Favoritos por ventas
- [x] Selección de variante obligatoria con precio real
- [x] Producto, carrito y checkout leyendo el espejo

## Fase 3 — Cotizador (BLOQUEADA hasta validación del menú por el usuario)
- [ ] Resolver de catálogo Woo en `quote-orchestrator` (sin tocar reglas)
- [ ] Tabla de roles/restricciones → woo_id
- [ ] Upsell y cross-sell con candidatos de Woo

## Fase 4 — Validación
- [ ] Comparación categoría por categoría contra berlioz.mx
- [ ] Cotizaciones de prueba (3 tipos de evento × 5/20/60 personas × con y sin restricciones)
- [ ] Flujo completo de pedido

## Reglas confirmadas por el usuario (23 sep)
- [x] Woo es la única fuente de verdad: sin publicar y activo → no existe
- [ ] BLT y BLT Box (borrador) fuera del cotizador hasta que Ana los publique
- [ ] Box Keto → PINK BOX KETO - SIN GLUTEN ($380)
- [ ] Precios siempre de Woo (Roma $300, Aqua Box $330)
- [ ] Agua Fresca genérica → 4 aguas reales en rotación, temporada con prioridad leída de Woo
- [x] Log de productos del cotizador sin match publicado (tabla catalogo_exclusiones)

## Ejecución en curso (Fase 1 y 2 aprobadas)
- [x] Migración: columnas del espejo + tabla catalogo_exclusiones
