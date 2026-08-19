# Corregir link de WhatsApp en el header

## Objetivo
Actualizar el enlace de WhatsApp del header para que use `https://wa.me/525582375469?text=Hola%2C%20quiero%20cotizar%20mis%20Boxes%20Berlioz` con `target="_blank"` y `rel="noopener noreferrer"`, y que el mensaje precargado esté definido como una constante.

## Estado actual confirmado
El header que renderiza el botón de WhatsApp con el número "55 8237 5469" es `src/components/layout/Navbar.tsx`. Actualmente usa la constante `WHATSAPP_URL = "https://wa.me/525582375469"` en dos lugares: el header desktop y el menú móvil. No hay otros headers con ícono de WhatsApp (BerliozHeader y MinimalHeader usan ícono de teléfono con `tel:`).

## Cambios a realizar

### 1. Definir constante del mensaje precargado
- En `src/components/layout/Navbar.tsx`, reemplazar la constante existente `WHATSAPP_URL` por una nueva constante que incluya el mensaje:
  ```ts
  const WHATSAPP_URL = "https://wa.me/525582375469?text=Hola%2C%20quiero%20cotizar%20mis%20Boxes%20Berlioz";
  ```

### 2. Verificar atributos en ambos usos del enlace
- Desktop (línea ~110): asegurar que el `<a>` tiene `href={WHATSAPP_URL}`, `target="_blank"` y `rel="noopener noreferrer"`. Ya los tiene.
- Móvil (línea ~223): asegurar que el `<a>` tiene `href={WHATSAPP_URL}`, `target="_blank"` y `rel="noopener noreferrer"`. Ya los tiene.

### 3. No tocar otros archivos
- No modificar `BerliozCatalog.ts`, `useSmartQuote.ts`, `ProposalStep.tsx`, `useCatalogoCotizador.ts`, `QuotePage.tsx`, `src/data/shippingZones.ts`, ni ningún otro archivo fuera de `src/components/layout/Navbar.tsx`.

## Archivos a modificar
- `src/components/layout/Navbar.tsx` (único archivo)

## Verificación
- Build de TypeScript/Vite debe pasar.
- En el preview, el link de WhatsApp en desktop y móvil debe apuntar al nuevo `wa.me` con mensaje precargado.
