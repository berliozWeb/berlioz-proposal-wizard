# Nueva sección "Una Box, todo resuelto"

Sección de propuesta de valor con la foto de la Box al centro y 6 tags interactivos flotando alrededor, insertada entre el hero/slider y "¿Qué necesitas hoy?".

## Ubicación exacta

En `src/pages/HomePage.tsx`, entre la barra navy de confianza (SECTION 2) y la sección "¿Qué necesitas hoy?" (SECTION 3). Ni el hero ni las cards de esa sección se modifican.

## Nuevo componente

`src/components/landing/BoxValueSection.tsx` — autocontenido, sin dependencias nuevas (solo lucide-react + react-router-dom ya presentes).

- Fondo: crema `#FDFAF7`
- Título centrado: "Una Box, todo resuelto" (Montserrat, navy `#014D6F`)
- Subtítulo: "Así se ve un pedido Berlioz" (gris suave, text-sm)
- Imagen central: la foto adjunta de la Box con fondo crema, subida como asset CDN e importada como pointer

## Layout desktop

Grid de 3 columnas: tags izquierda / imagen / tags derecha, con los tags ligeramente encimados sobre las orillas de la foto (translate negativo) para que se sientan anclados al producto.

```text
[ tag 1 ]                          [ tag 4 ]
           +-------------------+
[ tag 2 ]  |    foto de Box    |   [ tag 5 ]
           +-------------------+
[ tag 3 ]                          [ tag 6 ]
```

Izquierda: Leaf "Empaques y cubiertos biodegradables" · ClipboardCheck "Ingredientes cuidadosamente seleccionados" · FileText "Autofacturación"

Derecha: Sprout "Opciones vegetarianas, veganas, sin gluten y sin lactosa" · Users "Menú que se adapta a tu junta o evento" · Building2 "Opciones para eventos masivos"

## Estilo de los tags

Fondo blanco/crema muy claro, borde sutil, `rounded-xl`, sombra ligera, ícono lucide a la izquierda, texto navy `#014D6F` en Montserrat `text-sm`. Hover: elevación mínima.

## Interactividad

- Click en un tag abre un popover anclado a ese tag con: título en bold, texto descriptivo y CTA "Hacer pedido →" (fondo navy `#014D6F`, texto crema, hover sutil).
- El CTA navega a `/menu`, la misma ruta del link "Realizar Pedido" del navbar. No se crean rutas.
- Un solo tag abierto a la vez; click fuera o en otro tag cierra el anterior (listener en `document` + ref).

## Móvil

Imagen arriba a ancho completo y los 6 tags apilados debajo en una columna, como acordeón: el click expande hacia abajo mostrando texto + CTA. Sin tags flotando sobre la foto.

## Animación

Fade-in suave y escalonado de los tags al entrar en viewport (`IntersectionObserver` + delay incremental de ~80 ms). Nada exagerado.

## Decisión pendiente: tratamiento de la imagen

Como pediste ver ambas opciones:

- **Opción A — Seamless (recomendada):** sin contenedor ni borde; la foto se funde con el fondo crema mediante un `mask-image` radial suave en las orillas. Se siente editorial y "sin caja".
- **Opción B — Card:** `rounded-2xl` + sombra suave difusa. Más definida y con mejor separación de los tags flotantes, pero rompe el efecto seamless.

Implementaré la **Opción A** salvo que prefieras la B (dímelo y la cambio en un solo ajuste).

## Notas técnicas

- La imagen adjunta se sube con `lovable-assets` y se importa como pointer `.asset.json` (no se copia el binario al repo).
- Textos de los 6 popovers exactamente los que indicaste.
- Sin cambios en header, navegación, WhatsApp, carrito, checkout ni rutas.
