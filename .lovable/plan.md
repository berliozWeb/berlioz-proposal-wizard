## Objetivo

Producir **un solo archivo `.sql`** descargable desde `/mnt/documents/berlioz_full_export.sql` que, ejecutado en el SQL Editor de tu proyecto `ktyupdpzgmzzfkskkvpn` (vacío), recree el backend Berlioz tal cual hoy: tablas, tipos, funciones, RLS, políticas y todos los datos.

## Contenido del archivo (en orden)

1. **Header con instrucciones** de uso (cómo correrlo, requisitos, orden).
2. **Extensiones**: `pgcrypto` (para `gen_random_uuid`).
3. **Tipos enum**: `order_frequency` y cualquier otro USER-DEFINED detectado en `profiles`.
4. **Tablas (DDL)** — las 22 tablas actuales con columnas, tipos, defaults, NOT NULL y PRIMARY KEY:
   `catalog_import_runs, companies, coupons, delivery_addresses, discount_codes, generated_images_cache, order_items, orders, product_relations, productos, products, profiles, quote_feedback, quote_package_items, quote_packages, quote_proposals, quote_requests, quotes, sales_history, sales_insights, scheduled_orders, woo_order_items`.
   - Sin FOREIGN KEYs hacia `auth.users` (se quedan como `uuid` sueltos para que no truene en un proyecto vacío).
   - Con FKs internas que sí existen entre tablas públicas (ej. `quote_packages.proposal_id → quote_proposals.id`).
5. **Funciones** (las 5 actuales): `is_admin`, `search_products_for_quote`, `handle_new_user`, `update_updated_at`, `get_my_email_domain`. Todas con `SECURITY DEFINER` y `SET search_path = public` como están hoy.
6. **Trigger** `on_auth_user_created` envuelto en `DO $$ ... IF EXISTS (auth.users) ... $$` para que no truene si en tu proyecto destino el schema `auth` aún no está listo.
7. **RLS**: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` en cada tabla.
8. **Políticas**: las ~50 políticas actuales recreadas literalmente con sus `USING` y `WITH CHECK`.
9. **Datos (INSERTs)** — total ≈ 1,800 filas, ordenados respetando dependencias:
   - `productos` (270), `products` (10), `companies` (0), `discount_codes` (0), `coupons` (0)
   - `sales_history` (218), `sales_insights` (13), `product_relations` (0), `generated_images_cache` (15)
   - `woo_order_items` (389), `catalog_import_runs` (0)
   - `profiles` (1), `delivery_addresses` (1), `scheduled_orders` (0)
   - `orders` (0) → `order_items` (0)
   - `quotes` (1), `quote_requests` (61) → `quote_proposals` (61) → `quote_packages` (183) → `quote_package_items` (544) → `quote_feedback` (13)
   - Cada bloque de inserts envuelto en `BEGIN; ... COMMIT;` y con `ON CONFLICT (id) DO NOTHING` para que sea idempotente (puedes correrlo dos veces sin romper nada).
   - Strings escapados con `quote_literal`, JSONB serializado correctamente, arrays Postgres en notación `'{a,b,c}'`.
10. **Verificación final**: bloque `SELECT count(*) FROM ...` por tabla para que veas en pantalla que todo cargó con los conteos esperados.

## Cómo lo voy a generar (cuando apruebes)

Un script Python en `/tmp/export.py` que:
1. Conecta vía `psql` (las env vars `PG*` ya están en el sandbox) y vuelca DDL + datos.
2. Para DDL: usa `pg_dump --schema-only --schema=public --no-owner --no-acl` filtrado.
3. Para datos: por cada tabla, `COPY ... TO STDOUT` y los reformatea como `INSERT INTO ... VALUES (...) ON CONFLICT DO NOTHING`.
4. Concatena todo en `/mnt/documents/berlioz_full_export.sql`.
5. Ejecuta una QA sobre el archivo: cuenta `INSERT INTO` por tabla y verifica que coincida con los conteos reales (productos=270, woo_order_items=389, etc.).

Te entrego el archivo como `presentation-artifact` para que lo descargues y lo pegues en el SQL Editor de tu proyecto destino.

## Lo que NO incluye (y por qué)

- **Usuarios de `auth.users`** — son del schema gestionado de Supabase. Tendrás que recrearlos desde Authentication → Users en el dashboard de tu proyecto destino, o dejar que se autogeneren cuando alguien firme. El UUID del único `profile` actual quedará huérfano hasta que crees un usuario con ese mismo UUID, o lo borres.
- **Storage buckets** — hoy el proyecto no tiene buckets en `storage.objects` (las imágenes viven en un bucket externo `Berlioz-images`). No hay nada que migrar ahí.
- **Edge functions** — son código, no DB. Si las quieres en el otro proyecto las copias manualmente desde `supabase/functions/`.
- **Secrets** (`ANTHROPIC_API_KEY`, `WOO_WEBHOOK_SECRET`, etc.) — los configuras a mano en el dashboard del proyecto destino.

## Resultado esperado

Un archivo `.sql` de ~3-5 MB, autocontenido, idempotente, que en el SQL Editor de `ktyupdpzgmzzfkskkvpn` corre en 30-90 segundos y deja la base con esquema y datos idénticos a Lovable Cloud.

Después de aprobar, vuelvo a modo default, ejecuto la generación y te entrego el artifact.