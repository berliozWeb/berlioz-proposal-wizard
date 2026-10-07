# Roadmap — WooCommerce como fuente de verdad

## Tarjetas del home (7 oct)
- [x] Mover selección debajo del hero y encima de ¿Por qué BERLIOZ?, cambiar título y quitar subtítulo.
- [x] Cuatro tarjetas: DESAYUNO, COFFEE BREAK, WORKING LUNCH y BOXES ECONÓMICAS; MXN, VER MENÚ y colores invertidos al pasar el cursor.
- [x] Categoría económica derivada de boxes Woo con precio menor a $250, sin cambiar datos; seis productos verificados en navegador.

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

## Fase 5 — Checkout en berlioz.mx (WooCommerce) ✅
- [x] Edge function `woo-create-order`: valida el carrito contra la copia de Woo y crea el pedido (status pending, precios de Woo)
- [x] Llaves lectura/escritura de Woo (`WOOCOMMERCE_CONSUMER_KEY` / `_SECRET`) usadas para crear pedidos
- [x] Liga de pago tomada de `payment_url` de Woo (`/finalizar-compra/order-pay/...`)
- [x] CheckoutPage: "CONTINUAR AL PAGO", total marcado como estimado, sin selector de método de pago
- [x] Pruebas: producto simple, variante y producto inexistente (rechazo 409)
- [ ] Cancelar en WordPress los pedidos de prueba 32425, 32426 y 32427 (PRUEBA - NO SURTIR)

## Fase 6 — Pedidos confirmados → Google Calendar (hola@berlioz.mx) ✅
- [x] Google Calendar conectado (hola@berlioz.mx)
- [x] Registro pedido ↔ evento (sin duplicados, borra al cancelar/reembolsar)
- [x] Evento creado desde el aviso de la tienda cuando el pedido pasa a "Procesando" (solo pedidos de la página nueva)
- [x] Prueba de creación y borrado en el calendario
- [ ] Confirmar en WordPress que el aviso de la tienda incluye "Pedido actualizado" (la conexión con la tienda no respondió)

## Ajustes de contenido y jerarquía del home
- [x] Contadores exactos: 11, +500,000 y +500
- [x] Hero con un H1 fijo y frases rotativas como texto secundario
- [x] Sincronizar cada opción alimentaria rotativa con su descripción, sin cambiar estilos
- [x] Corregir jerarquía de testimonios, footer, /contacto y /recompensas
- [x] Validar escritorio, móvil y jerarquía de encabezados

## Optimización del hero y video Lunch Box
- [x] Hero fijo con titular, subtítulo de cobertura real y dos acciones visibles
- [x] Simplificar videos de fondo y eliminar textos superpuestos
- [x] Añadir posters y estrategia móvil/Save-Data
- [x] Añadir pausa y respetar movimiento reducido
- [x] Ajustar video Lunch Box a reproducción silenciosa, poster y preload none
- [x] Validar escritorio, móvil, Save-Data y movimiento reducido

## Compra en /menu (29 sep)
- [x] Agregar directo con min_qty (respaldo 1 pieza; 0 de 111 productos activos tienen min_qty lleno) + toast
- [x] Badge de piezas (totalUnits) en el carrito del header
- [x] Barra fija móvil "Ver pedido · $X" en /menu
- [x] "Realizar Pedido" como botón de color en desktop

## SEO técnico (29 sep)
- [x] Helmet por ruta + noindex fuera de berlioz.mx (excepto regla 404)
- [x] og-image, íconos, manifest, robots, sitemap, JSON-LD, footer

## Páginas de producto con URL de Woo (29 sep)
- [x] /producto/{slug}/ desde el espejo Woo (slug decodificado), canonical con diagonal
- [x] "Ver detalles" como enlace real; PIROPO MUNDIAL y GOLDEN BOX con ventana
- [x] Título, descripción, precio + IVA, alt, JSON-LD Product/Offer MXN sin IVA
- [x] Sitemap: 5 páginas + 109 productos Woo; slugs viejos → 404 noindex
- [ ] Regenerar sitemap cuando Woo agregue productos (lista fija)

## Accesibilidad + WhatsApp flotante (29 sep)
- [x] Botón flotante WhatsApp móvil (wa.me/5215582375469, mensaje prellenado, evento Mixpanel whatsapp_click con page)
- [x] aria-label logo/carrito/login; aria-expanded + aria-controls en hamburguesa
- [x] aria-hidden en copia duplicada de logos y emojis de ocasiones
- [x] Tap targets 44x44 en carrito, Agregar y Ver detalles
- [x] "¿Por qué BERLIOZ?" con una sola versión por breakpoint

## Ajustes del hero (5 oct)
- [x] Actualizar subtítulo y colocar Cotizar evento antes de Hacer pedido
- [x] Mantener solo los videos 2 y 3 y optimizar su transferencia
- [x] Verificar que los videos retirados no se descarguen
- [x] Mover EL COMEDOR BERLIOZ debajo de ¿Qué vas a pedir hoy? (antes de ¿Por qué BERLIOZ?)

## Cotizar: pregunta de entregas (7 oct)
- [x] Pregunta "¿Cuántas entregas necesitas?" con subtítulo de logística y EXPERIENCIA FANTÁSTICA
- [x] "Una sola entrega" sin descripción; "Varias entregas": "Distintos momentos del día o alimentos por varios días."
- [ ] Quitar los íconos de las tarjetas "Una sola entrega" y "Varias entregas"
