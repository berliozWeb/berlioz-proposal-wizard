
User wants 4 changes to Step 3 proposal:
1. Reorder tiers: Equilibrado → Esencial → Experiencia Completa
2. Remove "Nuestra recomendación" badge from Equilibrado
3. Make selected package more visually prominent
4. Swap/Add product modal should show images + descriptions (currently the swap list is text-only per screenshot 2)

Let me check the relevant files to understand current structure.
<lov-tool-use id="toolu_vrtx_0114DkjzBiRisYWtdkHyRmC4" name="code--search_files" integration-id="code" data="{\"query\": \"NUESTRA RECOMENDACIÓN|Nuestra recomendación\", \"include_patterns\": \"src/**/*.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01Y6xAR1YESj2Tbu5uRnJpZ7" name="code--search_files" integration-id="code" data="{\"query\": \"Cambiar producto\", \"include_patterns\": \"src/**/*.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01CykkAGmHjCBuJf49cJVfu7" name="code--search_files" integration-id="code" data="{\"query\": \"NUESTRA RECOMENDACIÓN\", \"include_patterns\": \"src/**/*.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01TYE2txnJjGsuyhbSFPH9Ck" name="code--search_files" integration-id="code" data="{\"query\": \"Cambiar producto\", \"include_patterns\": \"src/**/*.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01D6Rw2buKPtDZ4N6TucaSML" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/quoter/ProposalStep.tsx\", \"lines\": \"1-80\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01BZLahGku1tVfyFQkou7PPB" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/quoter/ProposalStep.tsx\", \"lines\": \"800-900\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_019zDndLMetNDZvegyf6TT9p" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/quoter/ProposalStep.tsx\", \"lines\": \"1020-1104\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01VWeSMEsBnUS9unvwt33wHG" name="code--search_files" integration-id="code" data="{\"include_patterns\": \"src/**/*.ts,src/**/*.tsx\", \"query\": \"TIERS\\\\s*=|isPopular\"}">
</lov-tool-use>
I have enough context. Let me check the sidebar product list shape (description, image fields available).
<lov-tool-use id="toolu_vrtx_01BWuF6iH62G2DJnmF4BUTyC" name="code--search_files" integration-id="code" data="{\"include_patterns\": \"src/domain/entities/BerliozCatalog.ts\", \"query\": \"CatalogProduct|imagen|description|descripcion\"}">
</lov-tool-use>
I have everything I need. The sidebar product list lacks images & descriptions in the current modal — I need to enhance it using `buildProductImageUrl`/`useProductImage` (already imported) and `product.description`.

<lov-plan>

## Plan: Reordenar tiers, quitar tag, resaltar selección y mejorar el menú "Cambiar/Agregar"

**Archivo único:** `src/components/quoter/ProposalStep.tsx`

### 1. Reordenar tiers (línea 83-100)
Cambiar el orden del array `TIERS` para que aparezca:
1. **Equilibrado** (primero)
2. **Esencial** (segundo)
3. **Experiencia Completa** (tercero)

Esto reordena automáticamente las filas en la propuesta y el mapeo en el sidebar/PDF (todos consumen `TIERS.map`).

### 2. Quitar tag "Nuestra Recomendación" (líneas 846-850)
Eliminar el `<span>` completo del badge. El tier Equilibrado seguirá marcado como `isPopular: true` solo para mantener el estilo visual del CTA primario y borde, pero sin el chip textual.

### 3. Resaltar selección de paquete de forma más notoria (líneas 837-841)
Reforzar el estado `isSelected`:
- Borde más grueso `border-2 border-[#014D6F]` (en vez de ring sutil)
- Sombra más marcada: `shadow-[0_8px_30px_rgba(1,77,111,0.18)]`
- Fondo sutil teñido: `bg-[#014D6F]/[0.02]`
- Pequeño check-pill flotante arriba a la derecha: "✓ Paquete seleccionado" con fondo teal sólido
- El botón "✓ Seleccionado" ya cambia de estilo, se mantiene

### 4. Menú "Cambiar/Agregar" con imágenes y descripciones (líneas 1076-1098)
Rediseñar la lista de productos del sidebar para que cada item muestre:
- **Imagen** del producto (96x96 redondeada) usando `useProductImage(product.name)` o `buildProductImageUrl`
- **Nombre** + estrella si es bestseller
- **Descripción** (`product.description`) en 2 líneas con `line-clamp-2`, color muted
- **Precio** en mono
- Botón "Cambiar" / "+ Agregar" alineado a la derecha

Como `useProductImage` es un hook, crearé un sub-componente `<SidebarProductCard product={...} onAdd={...} />` dentro del archivo que invoca el hook por item correctamente.

Layout: `flex gap-3 p-3` con la imagen a la izquierda, contenido al centro (flex-1, min-w-0), botón a la derecha. Aumentar el ancho del sidebar de `w-[360px]` a `w-[420px]` para que respire bien.

### Lo que NO se toca
- Lógica de cálculo de tiers, totales, swap, addons
- Pasos 1 y 2, hero, header, footer
- Edge functions
- PDF export

