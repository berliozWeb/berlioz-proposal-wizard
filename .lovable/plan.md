
User wants Step 3 tier rows in `ProposalStep.tsx` redesigned:
1. Compact Zona A (tier name + tagline) — move to top instead of left column, freeing horizontal space
2. Give product carousel (Zona B) more room
3. Make product card images larger / cards taller for visual impact

Current layout: `lg:grid-cols-[15%_1fr_220px]` — 3 columns side by side. Zona A takes 15% on left as a vertical block.

### Plan

**File:** `src/components/quoter/ProposalStep.tsx` (only tier row block, ~lines 644+)

**1. Restructure tier row layout**
- Change from 3-column grid to a vertical stack with 2 zones:
  - **Top bar** (full width): Zona A horizontal — tier name + tagline on left, "ELEGIR ESTE →" button on right
  - **Bottom**: 2-column grid `lg:grid-cols-[1fr_220px]` — Zona B carousel | Zona C breakdown
- Result: products get ~85% width instead of 70%

**2. Enlarge product cards in TierCarousel**
- Card width: `w-[180px]` → `w-[220px]`
- Image container height: current ~`h-32` → `h-44` (taller, more visual)
- Keep aspect, padding, qty controls intact
- "AGREGAR PRODUCTO" placeholder card matches new dimensions

**3. Keep untouched**
- All scroll logic, arrows, fades in TierCarousel
- Price calculations, handlers
- Zona C breakdown styling and content

### What NOT to touch
- Steps 1, 2, hero, header, footer
- Edge functions, totals logic, swap modal
