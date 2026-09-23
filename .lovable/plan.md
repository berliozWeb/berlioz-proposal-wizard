# Checkout: traspaso del carrito a berlioz.mx (WooCommerce)

## Regla
No se construye pago ni calendario propio. La nueva página sirve el catálogo y el carrito; el cobro, el calendario de cocina y los correos siguen viviendo en berlioz.mx.

## Cómo se hace el traspaso

La opción robusta es **crear el pedido en WooCommerce antes de redirigir**, no arrastrar el carrito por la URL.

1. El cliente arma su carrito en la página nueva y toca "Continuar al pago".
2. Una función de servidor crea un pedido real en berlioz.mx con estado `pending` (pendiente de pago), con:
   - cada renglón con su identificador de producto y de variante (jícama vs papitas, sandía vs tamarindo) y su cantidad,
   - precios calculados por WooCommerce, no por nosotros (así nunca hay diferencia de precio),
   - datos del cliente si ya inició sesión (nombre, correo, teléfono, dirección),
   - fecha y horario de entrega y las notas del pedido como campos del pedido,
   - el origen marcado como `web-nueva` para poder medirlo.
3. WooCommerce devuelve el número de pedido y su llave de pago. La página redirige a la pantalla de pago de ese pedido en berlioz.mx, con el pedido ya armado; el cliente solo confirma datos y paga con los métodos que ya tiene configurados.
4. Al volver de la pasarela, WooCommerce hace lo de siempre: confirma, dispara el calendario de cocina y los correos.
5. Cuando el pago se confirma, el espejo de pedidos que ya existe trae el pedido a la nueva página, así el historial del cliente y el panel siguen completos.
6. Si la creación del pedido falla, el cliente ve un aviso claro y se le ofrece un respaldo: un enlace a berlioz.mx con los productos precargados en el carrito.

## Qué se toca

- Nueva función de servidor `woo-create-order`: valida el carrito recibido, resuelve cada renglón contra la copia sincronizada de la tienda (solo productos publicados y activos), crea el pedido vía la conexión de WooCommerce y devuelve la URL de pago.
- `CheckoutPage.tsx` / `CartPage.tsx`: el botón de confirmar llama a esa función, muestra estado de carga y redirige. Se quitan del flujo los pasos de pago y de confirmación propios (quedan sin usar, no se borran todavía).
- El carrito local se limpia solo después de una redirección exitosa.
- El pedido lleva la fecha y el horario que el cliente eligió, para que la cocina no dependa de que los reescriba en WooCommerce.

## Detalles técnicos

- Creación: `POST /orders` de la API v3 de WooCommerce a través del gateway de conectores, desde una función de borde (las credenciales nunca salen al navegador).
- Renglones: `line_items: [{ product_id, variation_id?, quantity }]` sin `price`, para que Woo aplique su propio precio; `meta_data` para fecha/horario/notas; `set_paid: false`, `status: "pending"`.
- Redirección: `https://berlioz.mx/checkout/order-pay/{order_id}/?pay_for_order=true&key={order_key}` con `order_key` de la respuesta.
- Validación del carrito con Zod antes de llamar a Woo; se rechaza cualquier renglón cuyo `woo_id` no exista activo en la tabla `productos`.
- Respaldo: `https://berlioz.mx/?add-to-cart=<id>&quantity=<n>` (uno por renglón) o carrito precargado con varios ids.
- Si el cliente tiene cuenta con el mismo correo en Woo, se asocia el pedido a ese cliente (`customer_id`) buscándolo por correo.

## Riesgos

- Un pedido `pending` que nunca se paga queda en WooCommerce; Woo ya los cancela automáticamente pasado su plazo, se revisa que ese ajuste esté activo.
- Los cupones y el envío los recalcula WooCommerce en su checkout; el total que muestre la nueva página se marca como estimado para evitar confusión.
