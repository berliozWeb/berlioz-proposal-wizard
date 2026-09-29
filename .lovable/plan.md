# Plan: hero fijo y videos optimizados

## 1. Contenido fijo del hero

- Mantener un solo H1: **“Catering corporativo y box lunch en CDMX”**.
- Agregar debajo un subtítulo fijo que cubra qué es, para quién y dónde: **“Boxes, coffee breaks y catering para empresas y equipos en CDMX y Área Metropolitana.”**
- Mostrar siempre dos acciones principales:
  - **Hacer pedido** → `/menu`
  - **Cotizar evento** → `/cotizar`
- Eliminar del hero las frases y acciones variables de cada video; únicamente cambiará el fondo.

## 2. Legibilidad y transiciones

- Aplicar una capa negra uniforme de aproximadamente 45% entre el fondo y el contenido.
- Mantener el titular, subtítulo y botones en una sola capa fija, independiente de los cambios de fondo.
- Evitar que dos fondos o textos queden visibles simultáneamente durante la transición; la entrada del siguiente fondo será controlada y sin contenido duplicado.

## 3. Posters y carga eficiente

- Asociar a cada video una de las fotos de ocasiones existentes y usarla como `poster` y respaldo visual.
- Renderizar únicamente el video activo; el siguiente elemento se preparará inmediatamente antes del cambio y reemplazará al actual al estar listo.
- No precargar los seis videos: el activo usará carga controlada y los demás permanecerán sin crear.
- En pantallas móviles o cuando el navegador indique ahorro de datos, no crear elementos de video y mostrar las fotos estáticas correspondientes.
- No modificar ni mover los archivos de video alojados actualmente.

## 4. Pausa y accesibilidad

- Agregar un control visible de pausa/reproducción para detener o reanudar tanto la rotación automática como el video activo.
- Mantener las flechas y puntos para navegación manual cuando el movimiento esté permitido.
- Si el dispositivo solicita movimiento reducido:
  - mostrar una imagen estática;
  - detener la rotación automática;
  - evitar transiciones animadas;
  - conservar el contenido y las acciones totalmente funcionales.
- Usar etiquetas accesibles en español y estado visual claro para el control.

## 5. Video de Lunch Box

- Agregarle una foto existente como poster.
- Mantenerlo siempre silenciado y eliminar el inicio automático con audio al entrar en pantalla.
- Dejar la reproducción bajo control explícito del usuario mediante su botón reproducir/pausar.
- Retirar el control de volumen/sonido que ya no aplica.
- Respetar también movimiento reducido, mostrando el poster hasta que el usuario decida reproducirlo.

## 6. Validación

- Revisar escritorio: contenido fijo, dos acciones visibles, fondo oscurecido, pausa funcional y máximo un video activo.
- Revisar móvil: solo imagen estática, sin descarga de videos y sin desbordamientos.
- Simular ahorro de datos y movimiento reducido para confirmar que no se crean ni reproducen videos automáticamente.
- Comprobar que todos los videos tengan poster y que Lunch Box permanezca silenciado.
- Confirmar que `/menu` y `/cotizar` abran desde sus botones y que la vista previa quede sin errores.

## Límites respetados

No se tocarán base de datos, Lovable Cloud, archivos de video almacenados, `/admin`, `/dashboard`, checkout ni estilos generales. Los cambios se limitarán al hero del home y al reproductor visual de Lunch Box.
