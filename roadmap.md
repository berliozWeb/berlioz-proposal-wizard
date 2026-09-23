# Roadmap — WooCommerce como fuente de verdad

## Fase 1 — Espejo fiel de Woo ✅
- [x] Sync por nombre de categoría + todas las categorías del producto
- [x] Sincronizar variantes (`/products/{id}/variations`)
- [x] Columnas nuevas: permalink, woo_tags, en_stock, menu_order, upsell_ids, galería
- [x] Desactivar las 176 filas del menú viejo
- [x] Apagar el endpoint externo del backoffice (`externalCatalog.ts`)

## Fase 2 — "Realizar pedido" idéntico a berlioz.mx ✅ (validada por el usuario)
- [x] Categorías del menú desde Woo (7, en su orden) + Favoritos por ventas
- [x] Selección de variante obligatoria con precio real
- [x] Producto, carrito y checkout leyendo el espejo

## Fase 3 — Cotizador ✅
- [x] Resolver de catálogo Woo en `quote-orchestrator` v6 (reglas, IA, bandas y tiers intactas)
- [x] Tabla `cotizador_roles_producto` (34 roles → woo_id) con RLS
- [x] Upsell (`get-upsell-recommendations`) con candidatos dinámicos de Woo
- [x] Respaldo del cotizador (`useSmartQuote`) ya lee Woo, sin listas fijas
- [x] Pestaña "Surtidos" retirada del cotizador (no existe en Woo)

## Fase 4 — Validación ✅
- [x] Cotizaciones de prueba: comida 20 pax, desayuno 5 pax (vegano + keto), coffee break 60 pax (vegetariano)
- [x] Upsell probado (4 sugerencias reales de Woo)
- [x] Flujo completo en /cotizar verificado en navegador: precios de Woo, desglose, upsell, sin errores
- [x] `catalogo_exclusiones`: única exclusión MUESTRAS (oculto por membresía en WordPress)

## Reglas confirmadas por el usuario (23 sep)
- [x] Woo es la única fuente de verdad: sin publicar y activo → no existe
- [x] BLT y BLT Box (borrador) fuera del cotizador hasta que Ana los publique
- [x] Box Keto → PINK BOX KETO - SIN GLUTEN ($380)
- [x] Precios siempre de Woo (Roma $300, Aqua Box $330)
- [x] Agua Fresca genérica → aguas reales de Woo en rotación, temporada priorizada
- [x] Log de productos del cotizador sin match publicado (tabla catalogo_exclusiones)

## Deuda técnica pendiente
- [ ] Pantalla antigua `/propuesta` (no enlazada en el sitio) todavía usa el menú fijo: retirarla o migrarla a Woo
- [ ] Publicar BLT y BLT Box en Woo (Ana) → entran solos al sync
