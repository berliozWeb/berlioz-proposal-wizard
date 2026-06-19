# Plan: Espejo read-only de WooCommerce (Fase 1)

## Objetivo
Conectar este sitio como **lector** de tu WooCommerce actual. Woo sigue siendo la fuente de verdad de catálogo/pedidos/clientes. Aquí no se crean pedidos en Woo todavía — solo se **refleja** lo que ya existe. Cero riesgo para tu tienda en producción.

La Fase 2 (próxima) será empujar cotizaciones del backoffice como pedidos/draft a Woo. Eso queda fuera de este plan.

## Qué se hace ahora

### 1. Conectar WooCommerce vía connector
- Uso el conector estándar de WooCommerce de Lovable (gateway). Tú generas en tu WP un par de **claves REST API de solo lectura** (`Read`), las pegas una vez en el conector y listo.
- Las llaves nunca tocan el frontend ni el repo: viven en el gateway y se usan desde edge functions.
- Requisito en tu WP: permalinks distintos a "Plain" (la REST API de Woo lo necesita).

### 2. Edge function `woo-catalog-sync` (pull periódico / on-demand)
- Llama `GET /products?per_page=100&status=publish` paginado vía gateway.
- Llama `GET /products/categories` para mapear categorías.
- Hace upsert en la tabla `productos` ya existente, mapeando:
  - `id` (woo product id como texto), `sku`, `nombre`, `descripcion`, `descripcion_corta`
  - `precio` / `precio_min` / `precio_max` / `precio_rebajado`
  - `categoria` (nombre normalizado), `tipo` (`simple` / `variable`)
  - `imagen_url`, `imagenes_galeria`, `activo` (status=publish & stock_status=instock)
  - `variaciones` para productos variables (segundo fetch `/products/{id}/variations`)
- Campos **locales que NO se sobreescriben**: `dietary_tags`, `score_comercial`, `score_visual`, `destacado` curado manual, `popularity_rank`. Se hace `UPDATE` solo de las columnas Woo.
- Se ejecuta:
  - Manual desde un botón en `AdminInsightsPage` ("Sincronizar catálogo Woo")
  - Y automática vía cron (cada 30 min) usando `pg_cron` + `pg_net` invocando la function.

### 3. Edge function `woo-orders-mirror` (histórico de pedidos, opcional pero recomendado)
- Misma idea que el webhook que ya tienes, pero **pull** para traer el histórico que aún no está en `woo_order_items`.
- `GET /orders?after={fecha_max}&per_page=100&status=completed,processing` paginado.
- Upsert en `woo_order_items` con `ON CONFLICT (woo_order_id, product_id)` para no duplicar.
- Refresca `sales_insights` igual que el webhook actual.
- El webhook `woo-webhook` sigue funcionando para tiempo real; este pull solo cubre huecos.

### 4. UI: indicador de sincronización
- En `AdminInsightsPage`: badge con "Última sync: hace X min", botón "Sincronizar ahora", y conteo de productos espejo.
- Cero cambios visibles para el cliente final — el catálogo público sigue usando `useProductos` / `externalCatalog` igual que hoy.

### 5. Lo que NO se toca
- `CartContext`, checkout, cotizador, edge functions de AI, GHL sync.
- `woo-webhook` actual queda como está.
- El `get-catalog` externo (`rrfvdhegvgmejxmsdijn`) sigue siendo tu fuente del frontend; el espejo en `productos` queda disponible para AI / insights / la futura Fase 2.

## Detalles técnicos

**Nuevos archivos**
- `supabase/functions/woo-catalog-sync/index.ts`
- `supabase/functions/woo-orders-mirror/index.ts`
- Migración: tabla `woo_sync_runs (id, kind, started_at, finished_at, items_synced, error)` con RLS solo admin.
- Cron jobs vía migración: `select cron.schedule(...)` invocando ambas functions.

**Tabla `productos`**: ya existe con los campos necesarios. Solo agrego columnas `woo_last_synced_at timestamptz` y `woo_source boolean default false` para distinguir registros traídos de Woo de los manuales.

**Connector**: WooCommerce gateway-enabled. Llamadas vía `https://connector-gateway.lovable.dev/woocommerce/...` con `LOVABLE_API_KEY` + `WOOCOMMERCE_API_KEY` (secret inyectado al linkear el conector).

**Seguridad**: claves de Woo son **read-only** (permiso `Read` al generarlas). Aunque algo fallara, no puede modificar tu tienda.

## Lo que necesito de ti antes de ejecutar
1. **URL de tu WooCommerce** (ej. `https://berlioz.mx`) y confirmación de que los permalinks NO son "Plain".
2. **Confirmar que generarás las API keys con permiso `Read`** (WP Admin → WooCommerce → Ajustes → Avanzado → REST API → Añadir clave).
3. **¿Sincronizo también el histórico completo de pedidos** (puede ser miles, tarda varios minutos la primera vez) **o solo desde una fecha** (ej. últimos 90 días)?
4. ¿Te parece bien la frecuencia de **cron cada 30 min** para catálogo y cada **15 min** para pedidos, o prefieres otra?

Una vez me respondas eso, lanzo el `standard_connectors--connect` de WooCommerce y avanzo con la implementación. Nada en tu Woo se ve afectado en ningún momento.
