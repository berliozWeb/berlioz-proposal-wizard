
## Objetivo

Tres mejoras concretas al cotizador:

1. **Aprendizaje admin → insights**: que tú (admin) puedas calificar/comentar propuestas generadas y que ese feedback alimente automáticamente `sales_insights`.
2. **Restricciones dietéticas como conteo parcial**: si dices "2 veganos de 10 personas", la propuesta debe incluir 2 opciones veganas + 8 normales (no convertir todo a vegano).
3. **Precio por persona visible en el header de cada paquete** (junto a "Equilibrado / descripción"), respetando el presupuesto por persona si se indicó.

---

## 1. Loop de aprendizaje (admin feedback → insights)

### UI nueva
En `src/pages/Propuesta.tsx`, mostrar un panel **solo visible para admins** (usar `is_admin(auth.uid())` ya existente) debajo de cada `PackageCard` con:
- 👍 / 👎 rápido por paquete
- Textarea: "¿Qué falta o sobra? ¿Qué regla deberíamos aprender?"
- Selector de categoría: `presupuesto | operaciones | reglas_negocio | upselling | dietetico | balance_paquete`
- Botón **"Guardar como insight"**

### Flujo
1. El componente llama a una nueva edge function `admin-insight-feedback` con: `{ proposalId, packageTier, rating (-1|+1), comment, category, requestSnapshot }` (snapshot = peopleCount, budget, eventType, dietary).
2. La edge function:
   - Inserta en `sales_insights` con `insight_type = category`, `context_key = slug auto-generado` (ej. `feedback_<proposalId>_<tier>`), `insight_text = comment + contexto auto-anexado` ("Para evento X de N personas con presupuesto $Y/p..."), `metadata = { source: 'admin_feedback', rating, proposal_id, snapshot, priority: 'alta' }`.
   - Si `rating = -1`, también marca con `metadata.priority = 'alta'` para que Claude la priorice más.
3. Las nuevas reglas son consumidas automáticamente por `quote-orchestrator` en la siguiente cotización (ya tenemos el fetch de `sales_insights` con priorización por `metadata.priority='alta'`).

### Tabla auxiliar opcional
Crear `proposal_admin_feedback (id, proposal_id, package_tier, rating, comment, category, created_by, created_at)` para auditoría además del insight; el insert en `sales_insights` queda como la "regla aprendida".

### Resultado
Cada vez que rechazas una propuesta y dejas un comentario, se vuelve regla viva que Claude leerá la próxima vez.

---

## 2. Restricciones dietéticas como conteo parcial

### Cambio de modelo
Hoy `restriccionesDieteticas: DietaryRestriction[]` es un array global ("toda la propuesta es vegana"). Cambiarlo a:

```ts
restriccionesDieteticas: { tipo: DietaryRestriction; cantidad: number }[]
// ej: [{ tipo: 'vegano', cantidad: 2 }, { tipo: 'sin_gluten', cantidad: 1 }]
```

### Wizard (`StepPeople.tsx` o donde se capture)
- Por cada restricción seleccionada, agregar un input numérico "¿Cuántas personas?" con max = `personas` totales.
- Validación: suma de restricciones ≤ `personas`.

### Backend (`quote-orchestrator/index.ts`)
En la generación de paquetes:
- Calcular `personasNormales = total - sum(cantidad)`.
- Para cada item "principal" (ej. lunch box, breakfast box) con `pricing_model='per_person'`:
  - Generar **N items separados**: 1 línea por subgrupo dietético + 1 línea para los normales, cada una con su `quantity` correcto y producto compatible (`dietary_tags` que incluya el restrictivo).
- Mantener bebidas/snacks compartidos en cantidad total.
- Pasar a Claude el contexto: `"Distribución: 2 veganos, 1 sin gluten, 7 sin restricción → entrega líneas separadas por subgrupo"`.

### UI propuesta
En `PackageCard.tsx` mostrar las líneas etiquetadas: `🌱 PINK BOX VEGANO × 2`, `WHITE BOX × 7`, etc.

---

## 3. Precio por persona en header del paquete

### `PackageCard.tsx`
Mover/duplicar el `pricePerPerson` (línea 206) al **header** junto al título "Equilibrado":

```
EQUILIBRADO   $661/persona     [ELEGIR ESTE →]
Balance perfecto vegano para tu equipo
```

- Mostrar siempre con sufijo `/persona`.
- Si `form.tienePresupuesto && form.presupuestoPorPersona > 0`:
  - Si `pricePerPerson <= presupuestoPorPersona` → badge verde `✓ Dentro de tu presupuesto ($X/p)`.
  - Si excede ≤ 10% → badge ámbar `+$Y sobre tu presupuesto`.
  - Si excede > 10% → badge rojo + tooltip "Considera Esencial".
- En el orquestador, si hay presupuesto, **forzar** que al menos el paquete `equilibrado` cumpla `total/personas ≤ presupuestoPorPersona` (ajustar selección iterativamente o reducir cantidades opcionales).

---

## Archivos a tocar

- `supabase/functions/admin-insight-feedback/index.ts` — **nueva**
- Migración: tabla `proposal_admin_feedback` + grant admin-only RLS
- `src/pages/Propuesta.tsx` — panel admin de feedback (gated por `is_admin`)
- `src/components/proposal/AdminFeedbackPanel.tsx` — **nuevo**
- `src/domain/entities/IntakeForm.ts` — cambiar shape de `restriccionesDieteticas`
- `src/components/wizard/StepPeople.tsx` (o el step de dietética) — inputs de cantidad
- `src/domain/shared/WizardValidation.ts` — validar suma ≤ personas
- `supabase/functions/quote-orchestrator/index.ts` — distribución por subgrupo + presupuesto duro
- `src/components/proposal/PackageCard.tsx` — header con precio/persona + badge de presupuesto
- `src/presentation/hooks/useProposalPresenter.ts` — pasar dietary breakdown y presupuesto al orquestador
- Migración de datos: convertir `restriccionesDieteticas` legacy (string[]) a la nueva forma con `cantidad: personas` para compatibilidad temporal

---

## Notas técnicas

- El admin check será server-side en la edge function (`SELECT is_admin(auth.uid())`) antes de insertar.
- El `ON CONFLICT (insight_type, context_key) DO UPDATE` ya soportado evita duplicados si el admin re-edita el mismo feedback.
- El presupuesto duro en orquestador puede romper si el catálogo no tiene productos suficientemente baratos: en ese caso, devolver el paquete con flag `excedePresupuesto: true` y que la UI lo muestre claramente, no fallar silenciosamente.

¿Apruebas que lo implemente así?
