## Plan: Caja de texto libre con IA en el cotizador

### 1. Crear edge function `parse-quote-request`
Crear `supabase/functions/parse-quote-request/index.ts` con el contenido exacto que pasaste (Anthropic Claude Haiku, extrae JSON con `eventType`, `peopleCount`, `budgetEnabled`, `budgetPerPerson`, `dietaryCounts`, `contactName`, `companyName`). El secret `ANTHROPIC_API_KEY` ya está configurado. Desplegar la función.

### 2. Modificar `src/pages/QuotePage.tsx`
- Agregar states `naturalText` y `isParsing` junto a los demás del componente.
- Agregar función `handleNaturalParse` que llama a `supabase.functions.invoke('parse-quote-request', { body: { text: naturalText } })` y mapea la respuesta a los states existentes:
  - `eventType` → setEventType (mapeando `comida` → `working-lunch` si aplica)
  - `peopleCount` → setPeople
  - `budgetEnabled` → setHasBudget, `budgetPerPerson` → setBudget
  - `dietaryCounts[]` → setDietaryDistribution + setHasDietary
  - `contactName` → setClientName, `companyName` → setEmpresa
  - Avanzar a `setStep(1)` al terminar
- Insertar el bloque JSX (textarea + botón "Generar propuesta →") en step 0, exactamente como lo especificaste.

### 3. No tocar nada más
No modifico lógica de negocio, validaciones, otros steps, ni componentes no mencionados.

### Notas técnicas
- Mapeo `eventType`: el cotizador usa `"working-lunch"` pero el prompt devuelve `"comida"` — normalizo en el handler.
- `coffee-break` ya coincide.
- Manejo de errores: toast si la función falla.
