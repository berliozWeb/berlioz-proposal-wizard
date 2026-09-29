# Plan: jerarquía y contenido del home

## Alcance

1. **Corregir los contadores**
   - Ajustar la animación para que el último cuadro siempre muestre el valor final exacto, evitando que termine una unidad abajo por el redondeo de la animación.
   - Mantener `11` para “Años teniendo clientes felices”.
   - Mostrar `+500,000` para comidas y `+500` para empresas, conservando el separador de miles.

2. **Sincronizar el contenido de las opciones alimentarias**
   - Mantener la rotación actual entre “vegetariana”, “sin gluten”, “vegana”, “keto” y “sin lácteos”, corrigiendo “glúten” a “gluten”.
   - Hacer que el párrafo cambie junto con cada título y describa específicamente esa misma opción.
   - No centrar ni modificar estilos, espaciados o composición de la sección.

3. **Establecer un solo H1 en el hero**
   - Agregar el H1 fijo: “Catering corporativo y box lunch en CDMX”.
   - Conservar las frases rotativas de cada video como texto secundario, usando etiquetas de párrafo y menor jerarquía visual.
   - Mantener carrusel, videos, controles, tiempos y enlaces sin cambios.

4. **Corregir la jerarquía de encabezados**
   - Cambiar “Lo que dicen nuestros clientes” de H3 a H2.
   - Cambiar “¿Listo para cotizar?” de H3 a H2.
   - Convertir los nombres de testimonios de H4 a texto estilizado, sin cambiar su apariencia.
   - Convertir “Navegar”, “Empresa” y “Contacto” del footer de H4 a texto estilizado, sin cambiar su apariencia.
   - Cambiar “CONTACTO” a H1 en `/contacto`.
   - Cambiar “PROGRAMA DE RECOMPENSAS” a H1 en `/recompensas`.

5. **Validación**
   - Revisar en escritorio y móvil que el H1 fijo y los textos secundarios no se encimen.
   - Confirmar en el navegador que `/` tenga exactamente un H1, que los contadores terminen en `11`, `+500,000` y `+500`, y que las jerarquías solicitadas sean correctas.
   - Confirmar que `/contacto` y `/recompensas` tengan un H1 cada una.
   - Verificar que no haya errores en la vista previa.

## Límites respetados

No se modificarán la base de datos, Lovable Cloud, `/admin`, `/dashboard`, checkout, reglas comerciales ni estilos generales. Los cambios quedarán limitados a etiquetas, textos y ajustes visuales locales de las secciones indicadas.
