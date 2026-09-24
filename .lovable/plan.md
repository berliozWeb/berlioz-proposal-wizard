# Panel de administrador (solo hola@berlioz.mx y oscar@berlioz.mx)

## Qué vas a tener
- Una entrada **/admin** con su propio inicio de sesión (Google o correo y contraseña).
- Solo entran **hola@berlioz.mx** y **oscar@berlioz.mx**, y solo si el correo está verificado. Cualquier otra persona ve "Sin acceso" y vuelve al inicio.
- **Pedidos de la página nueva** (solo consulta): número, fecha, cliente, total, fecha y horario de entrega, estado en la tienda (Pendiente de pago, Procesando, Completado, Cancelado) y si ya se creó en el calendario. Filtros por estado y fecha, búsqueda por número o cliente, y botón "Ver en la tienda" que abre el pedido en el backoffice. No se edita nada aquí.
- **Configuración básica del sitio**: número y mensaje de WhatsApp, teléfono y correo de contacto, aviso superior opcional (texto y activar/desactivar), calendario de destino de pedidos y los mínimos y horas de corte que hoy están fijos (sábado $3,000, domingo/festivo $5,000, corte 3:00 PM, recargo 7:30 AM $290). Los cambios se aplican en el sitio sin tocar código.
- Las pantallas de admin que ya existen (Insights, Clientes, Sincronización de la tienda) quedan dentro del mismo panel con un menú lateral.

## Cómo se protege
- El permiso de administrador se da automáticamente solo a esas dos cuentas verificadas; no se puede otorgar desde la página.
- La lista de pedidos y la configuración se leen/guardan en el servidor revisando ese permiso; nadie más puede verlas aunque conozca la dirección.

## Detalles técnicos
- Roles: nueva tabla `user_roles` + `has_role()` (security definer). Trigger en alta y en verificación de correo que asigna `admin` solo si `email_confirmed_at` no es nulo y el correo es uno de los dos. `is_admin()` pasa a usar `user_roles`; se deja de depender de `profiles.admin_role` (hoy editable por el propio usuario vía su política de UPDATE — se corrige).
- Pedidos: tabla `web_orders` (woo_order_id, número, cliente, email, total, estado, fecha/horario de entrega, pay_url, created_at, updated_at). `woo-create-order` inserta al crear; `woo-webhook` actualiza el estado en cada "Pedido actualizado". Unión con `order_calendar_events` para mostrar el estado del calendario. RLS: SELECT solo admins.
- Configuración: tabla `site_settings` (key, value jsonb). Lectura pública (el sitio la necesita), escritura solo admins. Hook `useSiteSettings` con valores por defecto iguales a los actuales, para que nada cambie si la tabla está vacía. Navbar, contacto y reglas de checkout leen de ahí.
- Frontend: `/admin` (login si no hay sesión), `/admin/pedidos`, `/admin/configuracion`, y las rutas existentes bajo un `AdminLayout`. `AdminRoute` usa `has_role`.

## Pregunta abierta
- Si falta algún ajuste en "Configuración" que quieras editar tú mismo, dímelo y lo sumo.
