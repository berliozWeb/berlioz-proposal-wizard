# Páginas de producto con las URLs de WooCommerce

## Qué verá el cliente
- Cada producto con dirección en berlioz.mx tiene su propia página en `/producto/{slug}/`, la misma dirección que hoy tiene en berlioz.mx.
- En /menu, "Ver detalles" (y la foto y el nombre de la tarjeta) se vuelven enlaces reales a esa página. PIROPO MUNDIAL y GOLDEN BOX siguen abriendo la ventana de detalle actual.
- Las direcciones viejas con guion bajo (por ejemplo `pink_box`) muestran la página de "no encontrado" y los buscadores no la guardan.

## 1. Búsqueda por slug de Woo
- La página de producto deja de usar el catálogo viejo y busca en el espejo de Woo: productos activos, que vienen de Woo, simples o variables. Es el mismo filtro de /menu.
- El slug se saca del permalink guardado: `https://berlioz.mx/producto/{slug}/` → `{slug}`. Se compara sin distinguir mayúsculas.
- La página muestra lo mismo que la ventana de detalle actual: galería, descripción legible, variantes con cantidades independientes y "Agregar al carrito". Se reutilizan las piezas que ya existen para no duplicar nada.
- No se cambian la base de datos ni la sincronización.

## 2. Con y sin diagonal final
- `/producto/pink-box` y `/producto/pink-box/` abren la misma página. Sin diagonal, la dirección se reescribe con diagonal sin recargar la página.
- El canonical siempre es `https://berlioz.mx/producto/{slug}/`.

## 3. Enlaces desde /menu
- En la tarjeta, "Ver detalles", la foto y el nombre son enlaces `<a href="/producto/{slug}/">` que navegan dentro del sitio.
- Si el producto no tiene permalink, se mantienen los botones que abren la ventana de detalle.
- "Agregar" y el selector de variante no cambian.

## 4. Datos de cada página
- Título: `{Nombre} | Berlioz`.
- Descripción: la introducción de Woo sin formato, recortada a unos 155 caracteres. Si falta, se usa "{Nombre} de Berlioz, catering corporativo en CDMX y Área Metropolitana."
- Precio visible: el precio de Woo o "Desde $X" si tiene variantes, con la nota "+ IVA".
- Texto alternativo de la foto: "{Nombre} — {categoría} de Berlioz" y un número si hay varias fotos.
- JSON-LD con `Product` (name, description, image, sku con el ID de Woo solo dentro de los datos y nunca en la dirección, brand Berlioz, category) y `Offer`:
  - Un solo precio: `price` en MXN.
  - Con variantes: `AggregateOffer` con `lowPrice` y `highPrice`.
  - `priceCurrency: "MXN"`, `availability: InStock`, `url` canónica y `priceSpecification` con `valueAddedTaxIncluded: false`.

## 5. Sitemap
- Se regenera `public/sitemap.xml` con 114 direcciones: las 5 páginas públicas (/, /menu, /cotizar, /contacto, /recompensas) y los 109 productos con su permalink de Woo con diagonal final.
- Se quitan todos los slugs del catálogo viejo.
- Es una lista fija generada ahora con una consulta de solo lectura. Si Woo agrega productos, habrá que regenerarla. Lo anoto como pendiente en el roadmap.

## 6. Slugs viejos y productos inexistentes
- Un slug con guion bajo, o que no coincide con ningún producto activo, muestra la 404 del sitio con `noindex, nofollow` en cualquier dominio.
- Mientras carga no se muestra la 404, para que no aparezca un instante.

## No se toca
MenuCatalog.ts, /propuesta y sus componentes, el generador de propuestas de respaldo, el checkout, la base de datos ni la sincronización con Woo. El inicio viejo que usa el catálogo viejo tampoco se toca.

## Validación
Se revisa en el navegador: una dirección con diagonal y otra sin ella, la etiqueta canonical, el título, el JSON-LD, el enlace desde /menu, que los 2 productos sin permalink sigan abriendo la ventana y que `pink_box` muestre la 404 con noindex. Además, se confirma que el sitemap tenga 114 direcciones y que el sitio compile sin errores.

## Detalles técnicos
- Un nuevo hook `useProductoPorSlug(slug)` reutiliza `mapProducto` de `useMenuCatalogo` y lee `permalink`.
- Un helper `slugFromPermalink()` va en `src/lib/`.
- La ruta sigue siendo `/producto/:slug`. React Router ya acepta la diagonal final y la normalización se hace con `navigate(..., { replace: true })`.
- `Seo` recibe un canonical absoluto con diagonal y `noindex` en la 404.
