# Plan: SEO técnico de rutas públicas

## Aviso importante antes de empezar
Hoy **berlioz.mx es la tienda WooCommerce** y esta app se publica en berlioz-web.lovable.app (sin dominio propio conectado). Si ponemos canonical, og:url, og:image y sitemap apuntando a https://berlioz.mx antes de que ese dominio sirva esta app, Google entenderá que la página "real" es la de WooCommerce y la imagen de vista previa no cargará. Se construye todo con https://berlioz.mx como pediste; solo funcionará bien cuando el dominio apunte aquí.

## 1. Título, descripción y canonical por página
- Instalar react-helmet-async y un componente `Seo` reutilizable (title, description, canonical, og:title/description/url).
- Textos exactos que enviaste para Home, /menu, /cotizar, /contacto, /recompensas.
- /producto/:slug: "{Nombre} | Berlioz" y descripción = descripción corta limpia (~150 caracteres) + "Desde $X MXN". Canonical https://berlioz.mx/producto/{slug}.
- Quitar del index.html los tags que chocarían; dejar los generales como respaldo para WhatsApp/Facebook (esas redes solo leen el index.html, no los de cada página).

## 2. Imagen para compartir
- Crear og-image.jpg de 1200×630 (collage/recorte de fotos existentes de ocasiones, con logo Berlioz) en la carpeta pública, peso de unos cientos de KB.
- Reemplazar la captura de Lovable por https://berlioz.mx/og-image.jpg; añadir og:url y og:locale=es_MX.

## 3. Íconos
- Generar desde el logo actual: favicon (32px), apple-touch-icon (180px), íconos 192/512 y site.webmanifest (nombre Berlioz, color navy #014D6F). Declararlos en el index.html.

## 4. robots.txt
Disallow: /admin, /dashboard, /checkout, /login, /carrito + `Sitemap: https://berlioz.mx/sitemap.xml`.

## 5. sitemap.xml estático
Rutas públicas (/, /menu, /cotizar, /contacto, /recompensas) + todos los productos activos, obtenidos con una consulta **solo de lectura** hoy. Es una foto fija: si cambian productos, hay que regenerarlo.

## 6. Página 404
Meta robots noindex solo en esa página.

## 7. JSON-LD FoodEstablishment en el home
Con exactamente los datos enviados: nombre, teléfono, correo, dirección (Miguel Hidalgo, CDMX, 11450, MX, sin calle), areaServed y los 4 perfiles sociales. Sin openingHours.

## 8. Footer
Nuevo bloque con las 4 líneas indicadas, usando los estilos de texto que ya tiene el footer.

## No se toca
Base de datos (solo lectura para el sitemap), backend, checkout, /admin, diseño fuera del footer.

## Detalles técnicos
- `HelmetProvider` en main.tsx; `<Seo>` en HomePage, CatalogPage, QuotePage, ContactoPage, RecompensasPublicPage, ProductDetailPage, NotFound.
- canonical se quita del index.html (Helmet no deduplica `<link>`).
- Íconos y og-image generados con ImageMagick desde assets existentes.
- Validación: Playwright revisa title/description/canonical por ruta y que el JSON-LD sea JSON válido.
