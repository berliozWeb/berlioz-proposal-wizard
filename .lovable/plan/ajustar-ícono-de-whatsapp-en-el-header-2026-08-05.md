# Ajustar ícono de WhatsApp en el header

## Objetivo
Reemplazar el ícono de WhatsApp actual en `Navbar.tsx` por uno con estilo de línea (outline), consistente con los íconos de carrito y perfil: mismo tamaño, color navy y grosor de trazo, y alineado verticalmente con el número.

## Cambios a realizar

### 1. Revisar tamaño y estilo de los íconos existentes
- El carrito usa `ShoppingCart` con `style={{ width: 20, height: 20 }}` (equivalente a `size={20}`).
- Los íconos de lucide-react usan strokeWidth por defecto de 2.

### 2. Reemplazar ícono de WhatsApp
- Importar `MessageCircle` de `lucide-react`.
- Eliminar el SVG personalizado `WhatsAppIcon` del componente (o dejarlo solo si se usa en otra parte; en este caso solo se usa en WhatsApp).
- Usar `<MessageCircle size={20} color="#014D6F" strokeWidth={2} />`.

### 3. Alinear ícono + número
- El link debe mantener `href="https://wa.me/525582375469"`, `target="_blank"` y `rel="noopener noreferrer"`.
- Usar `flex items-center gap-2` para alinear verticalmente el ícono con el texto.
- Aplicar el cambio tanto en el header desktop como en el menú móvil.

### 4. Verificar visualmente
- Confirmar en preview que el ícono, el número y el carrito/perfil comparten tamaño, color y alineación.

## Archivos a modificar
- `src/components/layout/Navbar.tsx`
