# WooCommerce como única fuente de verdad de productos

## Situación actual (verificada hoy)

Hay **tres** fuentes de producto vivas al mismo tiempo:

| Flujo | De dónde lee hoy |
|---|---|
| `/menu` (catálogo) | tabla `productos` filtrando solo lo que vino de Woo (110 productos activos) |
| Producto, carrito, checkout, cotizador (panel de productos, cambios, upsell) | un **endpoint externo del backoffice viejo** (`get-catalog` de otro proyecto), no Woo |
| Cotizador (armado de los 3 paquetes) | **listas fijas escritas en código** dentro de `quote-orchestrator`: nombres, precios, imágenes y descripciones a mano (Desayuno, Comida, bebidas y snacks) |

Además la tabla `productos` mezcla 176 filas del menú viejo con 111 de Woo, y las
categorías están duplicadas (`Comida`/`Working Lunch`, `Coffee-break`/`Coffee Break`,
`Tortas-piropo`, etc.) porque el sync guarda el *slug* de Woo en vez del nombre.

En Woo hoy hay 7 categorías reales, exactamente las que quieres ver:
Coffee Break (38), Working Lunch (31), Desayuno (21), Bebidas (16),
Vegano / Vegetariano (14), Tortas Piropo (7), Entrega Especial (5).

## Objetivo

1. Un solo espejo de Woo alimentando **todo**.
2. "Realizar pedido" = lo mismo que ve un cliente hoy en berlioz.mx.
3. El cotizador conserva **todas** sus reglas y la IA, pero trabajando con productos de Woo.

---

## Fase 1 — Espejo completo y fiel de Woo

- Sincronizar la **categoría por nombre** de Woo (no el slug) y guardar todas las
  categorías de cada producto, no solo la primera. Adiós a los duplicados.
- Sincronizar las **variantes** (hoy no se traen): los 42 productos variables
  quedan con sus opciones y precios reales.
- Traer también: enlace del producto, galería completa, etiquetas de Woo, estado
  de inventario, orden del menú y los "upsell" que ya tienes configurados en Woo.
- Respetar las reglas de visibilidad que ya definimos (oculto del catálogo,
  restringido por membresía, precio $0 → inactivo).
- Marcar como inactivas las 176 filas del menú viejo, para que no se cuelen en
  ningún flujo. No se borran: quedan como respaldo histórico.
- Apagar el endpoint del backoffice viejo: producto, carrito, checkout y
  cotizador pasan a leer el espejo de Woo.

## Fase 2 — "Realizar pedido" idéntico a berlioz.mx

- Las pestañas del menú pasan a ser las 7 categorías reales de Woo, en su orden,
  más Favoritos (los más vendidos según Woo). Si mañana creas una categoría en
  Woo, aparece sola.
- Cada producto muestra el precio, la foto, la descripción y las variantes de Woo.
- Los productos con variante piden elegirla antes de agregar al carrito, con el
  precio de esa variante.
- Se mantienen buscador, "Ordenar por", paginación y el diseño de las tarjetas.

## Fase 3 — Cotizador: mismas reglas, productos de Woo

Se conserva **tal cual**: los 3 niveles (Esencial / Equilibrado / Experiencia
Completa), el cálculo de presupuesto por persona con banda de ±15%, las mezclas
50/50 y 33/33/33 según tamaño del grupo, la rotación para que dos cotizaciones no
salgan iguales, la jerarquía de restricciones (vegano cubre vegetariano, keto
implica sin gluten), bebidas y complementos por nivel, envío, IVA 16%, cortes de
horario y mínimos, el copy con IA, el upsell y los PDF.

Lo que cambia es de dónde salen los productos:

- Las listas fijas de código se reemplazan por una consulta al espejo de Woo:
  desayunos = categoría Desayuno ordenada por precio, comidas = Working Lunch,
  bebidas y complementos = Bebidas y Coffee Break. Precios, fotos y descripciones
  siempre los de Woo.
- Para las restricciones alimentarias (vegano, vegetariano, keto, sin gluten, sin
  lactosa) creo una **tabla de reglas editable** que asigna el producto de Woo que
  cumple cada restricción, con el criterio que ya está definido hoy. Es necesaria
  porque en Woo solo 1 de cada 3 productos trae etiquetas, así que no se puede
  adivinar. Queda documentada y se puede ajustar sin tocar código.
- Si Woo se queda sin un producto para un rol (por ejemplo, desapareció el box
  vegano), el cotizador elige el más cercano en precio dentro de la misma
  categoría y lo registra; nunca inventa un producto que no existe.
- El panel de productos, el cambio de producto dentro de un paquete y el upsell
  también leen el espejo, así que el cliente solo puede agregar cosas que
  realmente se venden.
- El upsell con IA deja de usar su lista fija de 15 complementos: los candidatos
  se sacan de Woo por categoría y ventas, con las mismas prioridades
  (bebidas primero, aguas frescas en temporada de calor, compatibilidad con
  restricciones).

## Fase 4 — Validación antes de dar por bueno

- Comparar producto por producto y categoría por categoría contra berlioz.mx.
- Generar cotizaciones de prueba cubriendo: desayuno / comida / coffee break,
  grupos de 5, 20 y 60 personas, con y sin restricciones, y revisar que los 3
  niveles, precios, envío, IVA y el PDF cuadren.
- Probar el flujo completo de pedido: menú → producto con variante → carrito →
  checkout.

---

## Riesgos y decisiones que necesito de ti

1. **Cualquier producto sin match publicado en Woo queda fuera** (regla ya cerrada,
   no hay decisión pendiente). Queda registrado en el log para tu revisión.

2. **Cotizaciones viejas.** Las guardadas siguen apuntando a productos antiguos;
   se conservan como están, sin recalcular.
3. **Woo como dependencia.** Si la tienda está caída, el sync no corre pero el
   sitio sigue mostrando la última copia buena. Nada de lecturas en vivo contra
   Woo en el navegador del cliente.
4. **Orden de entrega.** Propongo ejecutar Fase 1 y 2 primero, validar el menú
   contigo, y solo entonces tocar el cotizador. Así lo crítico (las reglas) se
   mueve con el catálogo ya verificado.

## Nota técnica

Sync (`woo-catalog-sync`): categoría por nombre + `woo_categorias text[]`,
variantes vía `/products/{id}/variations`, nuevas columnas (`permalink`,
`woo_tags`, `en_stock`, `menu_order`, `upsell_ids`, `imagenes_galeria`).
`quote-orchestrator`: las constantes `DESAYUNO`, `COMIDA`, `*_SINR`, `BEV_*`,
`ADDON_*` e `IMG` se sustituyen por un resolver que carga el catálogo desde
`productos` (Woo) y una tabla `cotizador_roles_producto` (rol/restricción →
`woo_id`); la lógica de selección, scoring, rotación y precios no se toca.
Frontend: `externalCatalog.ts` deja de apuntar al proyecto externo y
`useProductos`, `useCatalogoCotizador`, `useMenuCatalogo`, `useSmartQuote`
(fallback) y `BerliozCatalog.ts` convergen en el espejo local.
