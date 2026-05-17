## Plan: Actualizar system prompt de Claude en quote-orchestrator

### Cambio único
Reemplazar el `systemPrompt` actual (líneas 366-413) en `supabase/functions/quote-orchestrator/index.ts` por el texto exacto proporcionado por el usuario.

### El nuevo prompt incluye mejoras en:
- **Identidad de marca**: cotizador inteligente de Berlioz Catering Corporativo, franco-mexicana, clientes como EY México, DHL, PepsiCo, Thomson Reuters y Maersk.
- **Restricciones alimentarias**: reglas obligatorias y no negociables por tipo (vegano, vegetariano, sin gluten, sin lactosa, keto) con énfasis en respetar la distribución exacta de invitados.
- **Estructura de 3 tiers**: definición clara de Esencial (2-3 productos), Equilibrado (3-4 productos, recomendado), Experiencia (4-5 productos, premium).
- **Reglas de negocio**: IVA 16%, envío base $360, mínimos sábado/domingo, recargo temprano $290, vigencia 20 días, mínimo 4 personas, siempre incluir bebida, nombres exactos del catálogo.
- **Calidad**: priorizar score_comercial y historial de ventas.
- **Formato**: respuesta únicamente JSON, sin texto fuera del JSON.

### No se toca
- Lógica de fallback heurística
- RPC a la base de datos
- INSERTs en tablas
- Frontend
- userPrompt
- Cualquier otra lógica de la edge function

### Despliegue
Tras el cambio, se desplegará la edge function actualizada.
