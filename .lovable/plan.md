# Pedidos confirmados → Google Calendar (hola@berlioz.mx)

## Qué va a pasar
Cuando un pedido pasa a **"Procesando"** en la tienda (pago confirmado), se crea solo un evento en el calendario de hola@berlioz.mx con:
- **Título:** `(32363) x 14 PINK BOX - Con Ensalada de Jícama, x 2 AGUA DE TEMPORADA - Sandía`
- **Fecha y hora:** el día y el horario de entrega del pedido (1 hora de duración)
- **Lugar:** dirección de entrega, o "Recoger en Lago Onega 265, Modelo Pensil"
- **Descripción:** número de pedido, cliente y teléfono, empresa, productos con cantidades, hora del evento, notas del pedido, total y liga al pedido en WordPress

## Reglas
- Solo se crea el evento cuando el pedido está en "Procesando". Pendientes, cancelados o fallidos no crean nada.
- **Sin duplicados:** cada pedido crea un solo evento. Si la tienda avisa dos veces, el segundo aviso se ignora.
- **Cambios:** si el pedido se cancela o se reembolsa después, el evento se borra del calendario.
- **Cuáles pedidos:** por defecto, **solo los que vienen de la página nueva**. Los de berlioz.mx los sigue creando tu sistema actual, así no salen dos veces. Cuando quieras, se amplía a todos y apagas el sistema viejo.
- Si falla el calendario, el pedido no se afecta. Queda registrado el error y se reintenta en el siguiente aviso.

## Pasos
1. Conectar Google Calendar con la cuenta **hola@berlioz.mx** (te aparece una tarjeta para autorizar).
2. Usar el aviso de la tienda que ya existe (cuando un pedido se actualiza) para disparar la creación del evento.
3. Registro interno pedido ↔ evento para evitar duplicados y poder borrar al cancelar.
4. Prueba con un pedido pagado de la página nueva y revisión del evento en el calendario.

## Detalles técnicos
- Conector estándar `google_calendar` (cuenta del negocio, no de cada usuario). Llamadas vía gateway: `POST /calendars/primary/events` (o el id del calendario de hola@), `DELETE` al cancelar. Zona horaria `America/Mexico_City`.
- Disparador: función `woo-webhook` existente (firma verificada con `WOO_WEBHOOK_SECRET`) al recibir `order.updated`, con `status === "processing"`; la lógica del evento va en `_shared/calendarEvent.ts`.
- Fecha/hora: `_berlioz_fecha_entrega` + `_berlioz_horario_entrega`; si faltan (pedidos de berlioz.mx), se leen los campos de fecha del plugin de entrega de la tienda.
- Filtro de origen: `_berlioz_origen === "web-nueva"` (bandera configurable para incluir todos).
- Tabla nueva `order_calendar_events (woo_order_id único, google_event_id, status, last_error)` con RLS, solo accesible desde el servidor.
