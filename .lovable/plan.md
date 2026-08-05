# Reemplazar ícono MessageCircle por logo real de WhatsApp en el header

## Objetivo
Sustituir el ícono `MessageCircle` genérico que actualmente aparece junto al número `55 8237 5469` en el header por el logo oficial de WhatsApp en versión outline, manteniendo el estilo, tamaño, color y alineación actuales.

## Cambios a realizar

### 1. Revisar estilo actual de los íconos del header
- El carrito usa `ShoppingCart` con `style={{ width: 20, height: 20 }}` (equivalente a `size={20}`).
- Los íconos de `lucide-react` usan `strokeWidth` por defecto de 2.
- Color navy usado en los íconos: `#014D6F`.

### 2. Crear SVG inline del logo de WhatsApp
- Agregar un componente `WhatsAppIcon` (o SVG inline) dentro de `src/components/layout/Navbar.tsx`.
- El SVG debe ser la versión "outline" oficial del logo de WhatsApp.
- Debe respetar:
  - Tamaño 20x20 px.
  - Color de trazo `#014D6F`.
  - `strokeWidth={2}` (o equivalente en atributos SVG).
  - Relleno transparente (`fill="none"`).
- Vista del logo: burbuja de chat redondeada con el típico teléfono/auricular dentro.

### 3. Reemplazar uso de `MessageCircle`
- En el link desktop (línea ~103) reemplazar `<MessageCircle size={20} color="#014D6F" strokeWidth={2} />` por el nuevo SVG inline.
- En el link móvil del drawer (línea ~209) aplicar el mismo reemplazo.
- Mantener `flex items-center gap-2` para alineación vertical con el número.
- Mantener `href={WHATSAPP_URL}`, `target="_blank"` y `rel="noopener noreferrer"`.

### 4. Verificar visualmente
- Confirmar en preview que el logo de WhatsApp se renderiza correctamente, con el mismo tamaño, color y alineación que el carrito y el perfil.
- Validar que no queden referencias huérfanas a `MessageCircle` si se deja de usar por completo; de ser así, eliminarlo del import de `lucide-react`.

## Archivo a modificar
- `src/components/layout/Navbar.tsx`
