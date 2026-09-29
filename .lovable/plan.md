# Accesibilidad y botón flotante de WhatsApp

Siete ajustes de interfaz y accesibilidad. No se toca base de datos, checkout, textos de marketing ni lógica del carrito.

## 1. Botón flotante de WhatsApp (solo móvil)
Nuevo componente flotante, visible únicamente en pantallas chicas, que abre
`https://wa.me/5215582375469` con el mensaje prellenado
"¡Hola! Quiero ayuda para hacer mi pedido o cotizar".

Para que no estorbe:
- Se coloca arriba a la derecha de la zona inferior, con separación suficiente para quedar por encima de la barra "Ver pedido · $X" cuando esa barra existe.
- En el inicio se respeta el espacio del botón de pausa del hero (que vive del lado contrario), así que no se encima.
- Se le pone nombre accesible "Escríbenos por WhatsApp" y tamaño mínimo de 44×44 px.

## 2. Nombres accesibles en el encabezado
- Logo: "Inicio" (hoy dice "Berlioz").
- Ícono de carrito: "Carrito".
- Acceso/ingreso: "Iniciar sesión".

## 3. Menú hamburguesa
Se agregan `aria-expanded` (según esté abierto o cerrado) y `aria-controls` apuntando al panel del menú móvil, que recibe su `id`. La etiqueta pasa a español: "Abrir menú" / "Cerrar menú".

## 4. Contenido decorativo oculto para lectores de pantalla
- La segunda copia de los logos del carrusel de clientes se marca `aria-hidden="true"` (hoy se duplica la lista completa y se lee dos veces).
- Los emojis dentro de los enlaces de ocasiones se envuelven en un `<span aria-hidden="true">`.

## 5. Controles del carrusel en español
Flechas y puntos del hero: "Anterior", "Siguiente", "Ir al slide N", y pausa/reproducción en español.

## 6. Áreas de toque de 44×44 px
- Ícono de carrito del encabezado.
- Botón "Agregar" de las tarjetas de producto.
- Enlace "Ver detalles".
Se logra con altura/ancho mínimos, sin cambiar el aspecto visual más allá de un poco de holgura.

## 7. "¿Por qué BERLIOZ?" sin duplicados
Hoy la sección arma dos veces el mismo contenido (versión escritorio y versión móvil) y esconde una con CSS, así que ambas existen en la página.
Se cambia a detectar el tamaño de pantalla en tiempo real (`matchMedia`, punto de corte `lg`) y renderizar solo la versión que corresponde. Mismo diseño, mismo comportamiento, la mitad del contenido repetido.

## Detalles técnicos
- Nuevo `src/components/layout/WhatsAppFab.tsx`, montado en el layout base para que aparezca en todas las páginas públicas; se oculta en rutas de administración, panel y checkout.
- El desplazamiento vertical del botón usa una variable CSS que la barra móvil de "Ver pedido" ya puede ajustar, para no encimarse.
- `BoxValueSection` usa un hook local con `matchMedia("(min-width: 1024px)")` y escucha cambios de tamaño.
