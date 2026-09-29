# Plan: mejoras de compra en /menu

## 0. Datos verificados (solo lectura)

- 111 productos activos; **0** tienen `min_qty` lleno → los 111 caerían al respaldo de **1 pieza** al presionar "Agregar".
- **No existe** una validación de mínimo de $1,000 en el checkout. Las únicas reglas de mínimo actuales son:
  - "Mínimo 10 unidades" por producto en el paso 1 del checkout (`CheckoutStep1Cart.tsx`).
  - Mínimos de fin de semana ($3,000 sáb / $5,000 dom-festivo), solo como advertencia al elegir fecha.
  - Mínimos por código de producto en `BusinessRules.ts` (Comedor 10, Box Económica 20, Mini Box sin mínimo, etc.).
- Pendiente de decisión: qué monto y regla usar para la barra "Te faltan $X" (ver sección 4).

## 1. "Agregar" directo con cantidad mínima sugerida

- En `ProductoCard.tsx`, el botón **Agregar** dejará de abrir el stepper en 0: agregará de inmediato la cantidad mínima sugerida del producto (campo `min_qty`; si no existe, 1 pieza).
- Se elimina el flujo de dos pasos (stepper + botón OK) del estado inicial. El ajuste fino de cantidad seguirá disponible en el modal de detalle y en el carrito.
- Al agregar se mostrará un toast de confirmación (sonner ya montado): "Nombre del producto añadido al carrito" (el `addItem` del contexto ya lo emite; se conserva).
- Si el producto ya está en el carrito, el botón dirá **Agregar más** y sumará otra vez la cantidad mínima.

## 2. Badge de piezas en el carrito del header

- En `Navbar.tsx`, el badge del ícono del carrito mostrará el **número total de piezas** (`totalUnits` del contexto) en lugar del número de renglones (`itemCount`).
- Mismo estilo actual (círculo navy sobre el ícono); se oculta cuando el carrito está vacío.

## 3. Barra fija inferior en móvil: "Ver pedido · $X"

- En `CatalogPage.tsx`, el botón flotante actual se reemplaza por una **barra fija inferior de ancho completo** visible solo en móvil (`md:hidden`) cuando el carrito tiene productos.
- Texto: **"Ver pedido · $X"** con el subtotal del carrito formateado en MXN; al tocarla navega a `/carrito`.
- Se agrega padding inferior al contenido para que la barra no tape la última fila de productos.

## 4. Barra de progreso hacia el mínimo (escritorio y móvil)

- Barra de progreso con el texto **"Te faltan $X para el mínimo de $M"** en:
  - La barra fija inferior de móvil en `/menu`.
  - El panel lateral de carrito en `/menu` en desktop (cuando hay productos en el carrito).
- La barra se calcula sobre el subtotal de productos (sin IVA ni envío), sin modificar ningún cálculo existente.
- Al alcanzar el mínimo, el texto cambia a "Mínimo alcanzado" y la barra se llena.
- **Regla del mínimo**: se confirmará con el usuario antes de construir, ya que el checkout no tiene hoy ninguna validación de $1,000.

## 5. "Realizar Pedido" como botón de color en desktop

- En `Navbar.tsx` (solo desktop), el enlace **Realizar Pedido** se separa de los demás links y se muestra como botón sólido: fondo navy `#014D6F`, texto crema/blanco, esquinas redondeadas, con el mismo hover suave del resto del header.
- En el menú móvil se mantiene como enlace de texto normal.

## Validación

- Escritorio y móvil con Playwright: agregar desde la tarjeta con un clic, toast visible, badge con piezas, barra inferior con total actualizado, progreso en `/menu` en ambos tamaños y botón destacado en el header.
- Confirmar que el build queda sin errores.

## Límites respetados

No se tocará lógica de pago, Stripe, cálculo de precios/IVA/envío, base de datos ni `/admin`. Los cambios se limitan a `ProductoCard.tsx`, `Navbar.tsx` y `CatalogPage.tsx`.
