import type { IProposalGenerator } from '@/domain/repositories/IProposalGenerator';
import type { IntakeForm } from '@/domain/entities/IntakeForm';
import type { Proposal, Package, PackageItem } from '@/domain/entities/Proposal';
import type { AgentState } from '@/domain/entities/AgentState';
import { EVENT_TYPE_LABELS, type EventType } from '@/domain/value-objects/EventType';
import {
  BUSINESS_RULES, PROPOSAL_VALIDITY_DAYS, DELIVERY_FEE_BASE, DOUBLE_DELIVERY_FEE,
  getDeliveryCount, getDurationBlock, getBudgetTiers, AGENT_RULES,
  needsDoubleDelivery,
  type DurationBlock,
} from '@/domain/shared/BusinessRules';
import { calculateIVA, roundCents } from '@/domain/value-objects/Money';
import { MENU_CATALOG, getGroupPrice } from '@/domain/entities/MenuCatalog';
import type { MenuItem } from '@/domain/entities/MenuItem';

// ═══════════════════════════════════════════════════════════
// REAL CATALOG-BASED PROPOSAL GENERATOR
// Recommendation rules by duration × event type × level
// ═══════════════════════════════════════════════════════════

export class DeterministicProposalGenerator implements IProposalGenerator {
  generate(form: IntakeForm): Proposal {
    const people = form.personas;
    const deliveries = getDeliveryCount(
      form.esMultiDia, form.entregasPorDia, form.horasEntrega, form.fechaInicio, form.fechaFin,
    );
    const doubleDelivery = needsDoubleDelivery(form.eventType, people);
    const baseFee = doubleDelivery ? DOUBLE_DELIVERY_FEE : DELIVERY_FEE_BASE;
    const deliveryFee = baseFee * deliveries;
    const eventLabel = EVENT_TYPE_LABELS[form.eventType as EventType] || 'Evento';
    const durationBlock = getDurationBlock(form.duracionEstimada);

    let packages: Package[];

    if (form.tienePresupuesto && form.presupuestoPorPersona > 0) {
      const tiers = getBudgetTiers(form.presupuestoPorPersona);
      packages = [
        this.buildBudgetPackage('basico', 'Opción ajustada', 'Dentro de tu presupuesto',
          `Propuesta ajustada a tu presupuesto de $${form.presupuestoPorPersona}/persona para ${people} personas.`,
          ['Dentro del presupuesto indicado', 'Menú cuidadosamente seleccionado', 'Calidad Berlioz garantizada'],
          form.eventType, tiers.adjusted, people, deliveryFee, durationBlock),
        this.buildBudgetPackage('recomendado', 'Opción recomendada', 'Un paso más en experiencia',
          'Nuestra recomendación: invierte un poco más por persona y eleva notablemente la experiencia.',
          ['Mejor variedad y presentación', 'Incluye elementos premium', 'La opción más elegida'],
          form.eventType, tiers.recommended, people, deliveryFee, durationBlock),
        this.buildBudgetPackage('premium', 'Opción completa', 'La experiencia completa',
          'Una experiencia gastronómica integral con ingredientes premium y servicio completo.',
          ['Opciones gourmet y artesanales', 'Servicio completo de bebidas', 'Presentación de primer nivel'],
          form.eventType, tiers.complete, people, deliveryFee, durationBlock),
      ];
    } else {
      packages = [
        this.buildPackage('basico', 'Esencial', 'Lo necesario, bien ejecutado',
          `Un servicio funcional y confiable para ${people} personas.`,
          ['Entrega puntual garantizada', 'Precio base sin bebidas', 'Ideal para eventos recurrentes'],
          form.eventType, 'economico', people, deliveryFee, durationBlock),
        this.buildPackage('recomendado', 'Equilibrado', 'La experiencia que tu equipo merece',
          'Nuestro paquete más popular combina sabor, presentación y valor. Incluye bebidas.',
          ['Bebidas básicas incluidas', 'Variedad de opciones', 'Presentación profesional'],
          form.eventType, 'balanceado', people, deliveryFee, durationBlock),
        this.buildPackage('premium', 'Experiencia Completa', 'Cada detalle cuenta',
          'Una experiencia gastronómica integral con los mejores ingredientes, bebidas premium y snacks.',
          ['Café/Té Berlioz + aguas incluidas', 'Opciones gourmet', 'Postres y snacks premium'],
          form.eventType, 'premium', people, deliveryFee, durationBlock),
      ];
    }

    const now = new Date();
    const validUntil = new Date(now);
    validUntil.setDate(validUntil.getDate() + PROPOSAL_VALIDITY_DAYS);

    return {
      proposalId: `BZ-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      createdAt: now.toISOString(),
      intro: `Estimado/a ${form.nombre}, en Berlioz nos da mucho gusto preparar esta propuesta de ${eventLabel.toLowerCase()} para ${form.empresa}. Nuestro compromiso es ofrecer una experiencia gastronómica memorable con ingredientes frescos y un servicio impecable.`,
      packages,
      recommendedId: 'recomendado',
      recommendedReason: form.tienePresupuesto
        ? 'Recomendamos invertir un poco más por persona — la diferencia en experiencia es notable.'
        : '8 de cada 10 clientes eligen este paquete. Incluye bebidas y la mejor relación calidad-precio.',
      validUntil: validUntil.toISOString().split('T')[0],
      businessRules: BUSINESS_RULES,
    };
  }

  async generateWithPipeline(
    form: IntakeForm,
    onAgentUpdate: (agents: AgentState[]) => void,
  ): Promise<Proposal> {
    const eventLabel = EVENT_TYPE_LABELS[form.eventType as EventType] || form.eventType;
    const durationBlock = getDurationBlock(form.duracionEstimada);
    const hasBudget = form.tienePresupuesto && form.presupuestoPorPersona > 0;

    const agents: AgentState[] = [
      { id: 'discovery', name: 'Análisis del evento', icon: '🔍', status: 'idle', logs: [] },
      { id: 'menu', name: 'Selección de menú', icon: '🍽️', status: 'idle', logs: [] },
      { id: 'pricing', name: 'Cálculo de precios', icon: '💰', status: 'idle', logs: [] },
      { id: 'writer', name: 'Generación de propuesta', icon: '✍️', status: 'idle', logs: [] },
    ];

    const update = (idx: number, status: AgentState['status'], log?: string) => {
      agents[idx] = { ...agents[idx], status };
      if (log) agents[idx].logs = [...agents[idx].logs, log];
      onAgentUpdate([...agents]);
    };

    // ── Discovery Agent ──
    update(0, 'running', 'Analizando tipo de evento...');
    await delay(600);
    update(0, 'running', `Evento: ${eventLabel} · ${form.personas} personas · ${form.duracionEstimada}h`);
    await delay(500);

    // Duration-specific discovery logs
    if (durationBlock === 'beverages_only') {
      update(0, 'running', '⚡ Evento < 2h → SOLO bebidas. Mín. 2 bebidas/persona');
      await delay(400);
      if (form.personas < 8) {
        update(0, 'running', '👥 Grupo < 8 personas → aguas individuales + snacks individuales');
      } else {
        update(0, 'running', '☕ Recomendando: Café/Té Berlioz ($540 fijo) + Agua Bui ($50/pza)');
      }
    } else if (durationBlock === 'beverages_snacks') {
      update(0, 'running', '🍿 Evento 2-3h → Bebidas + snacks');
      await delay(400);
      update(0, 'running', '💡 Upsell: "¿Quieres agregar un surtido dulce para el postre?"');
    } else if (durationBlock === 'full_food') {
      update(0, 'running', '🍽️ Evento 3-5h → Comida principal + upsell bebidas');
      await delay(400);
      update(0, 'running', '💡 Dato: 8 de 10 pedidos de comida incluyen bebidas');
      await delay(300);
      update(0, 'running', '📌 Equilibrado y Premium incluyen bebidas automáticamente');
    } else {
      update(0, 'running', '📅 Evento 5+h → Día completo: desayuno + comida + coffee break');
      await delay(400);
      update(0, 'running', '🔄 CB AM mañana + Working Lunch mediodía + CB PM tarde');
    }
    await delay(400);
    update(0, 'running', `${AGENT_RULES.length} reglas de catálogo cargadas`);
    await delay(300);
    update(0, 'done', 'Análisis completado ✓');

    // ── Menu Selector Agent ──
    update(1, 'running', 'Consultando catálogo real Berlioz...');
    await delay(600);
    update(1, 'running', `${MENU_CATALOG.length} productos disponibles`);
    await delay(400);

    if (hasBudget) {
      update(1, 'running', `Presupuesto: $${form.presupuestoPorPersona}/persona`);
      await delay(400);
      update(1, 'running', 'Generando 3 tiers: ajustada ≤ presupuesto, recomendada +20%, completa +50%');
    } else {
      // Event-type-specific menu selection logs
      if (form.eventType === 'desayuno') {
        update(1, 'running', '🍳 Seleccionando: Desayuno Berlioz → Roma → Montreal');
      } else if (form.eventType === 'coffee_break') {
        update(1, 'running', '☕ Coffee Break: precios grupales (NO por persona)');
        await delay(300);
        update(1, 'running', '⚠️ CB pre-armado NO incluye café caliente → upgrade Café/Té +$540');
      } else if (form.eventType === 'comida') {
        update(1, 'running', '🍱 Seleccionando Working Lunch: Económico → Box Premium → Salmon');
      } else if (form.eventType === 'capacitacion') {
        update(1, 'running', '🎓 Capacitación → desayuno + comida + coffee breaks');
      } else if (form.eventType === 'evento_especial') {
        update(1, 'running', '🎉 Evento especial → boxes premium + surtidos + bebidas');
      }
    }
    await delay(500);
    update(1, 'running', 'Aplicando regla de upsell de bebidas en Equilibrado y Premium');
    await delay(400);
    update(1, 'done', 'Menús seleccionados ✓');

    // ── Pricing Agent ──
    update(2, 'running', 'Calculando precios con catálogo real...');
    await delay(500);
    if (form.eventType === 'coffee_break') {
      update(2, 'running', `Coffee Break → precio grupal para ${form.personas} personas`);
      await delay(300);
      if (form.personas >= 30) {
        update(2, 'running', '⚠️ 30+ personas con cafetera → doble envío $720');
      }
    }
    await delay(400);
    update(2, 'running', `Envío: $${DELIVERY_FEE_BASE}/entrega · IVA 16% adicional`);
    await delay(400);
    update(2, 'done', 'Precios calculados ✓');

    // ── Writer Agent ──
    update(3, 'running', 'Escribiendo propuesta comercial...');
    await delay(700);
    update(3, 'running', 'Personalizando narrativas por paquete...');
    await delay(500);
    update(3, 'done', 'Propuesta lista ✓');

    return this.generate(form);
  }

  // ── Package builders ──

  private buildPackage(
    id: Package['id'], displayName: string, tagline: string, narrative: string,
    highlights: string[], eventType: string, level: string, people: number,
    deliveryFee: number, durationBlock: DurationBlock,
  ): Package {
    const items = this.getItemsForLevel(eventType, level, people, durationBlock);
    const subtotal = items.reduce((s, i) => s + i.subtotal, 0) + deliveryFee;
    const iva = calculateIVA(subtotal);
    return {
      id, displayName, tagline, narrative, highlights, items,
      subtotalBeforeIVA: subtotal, iva, deliveryFee,
      total: roundCents(subtotal + iva),
      pricePerPerson: roundCents((subtotal + iva) / people),
    };
  }

  private buildBudgetPackage(
    id: Package['id'], displayName: string, tagline: string, narrative: string,
    highlights: string[], eventType: string, targetPricePerPerson: number,
    people: number, deliveryFee: number, durationBlock: DurationBlock,
  ): Package {
    const level = targetPricePerPerson <= 200 ? 'economico' : targetPricePerPerson <= 350 ? 'balanceado' : 'premium';
    return this.buildPackage(id, displayName, tagline, narrative, highlights, eventType, level, people, deliveryFee, durationBlock);
  }

  private findItem(id: string): MenuItem | undefined {
    return MENU_CATALOG.find(m => m.id === id);
  }

  private cbGroupPrice(id: string, people: number, fallback: number): number {
    const item = this.findItem(id);
    return item ? getGroupPrice(item, people) : fallback;
  }

  // ═══════════════════════════════════════════════════════════
  // ITEM SELECTION: duration × eventType × level
  // ═══════════════════════════════════════════════════════════

  private getItemsForLevel(eventType: string, level: string, people: number, durationBlock: DurationBlock): PackageItem[] {
    const items: PackageItem[] = [];
    const cafeBoxes = Math.ceil(people / 12);
    const surtidoSets = Math.ceil(people / 7);

    // ──────────────────────────────────
    // BEVERAGES ONLY (<2h)
    // ──────────────────────────────────
    if (durationBlock === 'beverages_only') {
      if (people < 8) {
        // Small group: individual items
        items.push(makeItem('agua_bui', 'Agua Bui Natural', 50, 1, people));
        if (level === 'economico') {
          items.push(makeItem('snack_ind', 'Snack Individual', 50, 1, people));
        } else if (level === 'balanceado') {
          items.push(makeItem('agua_jamaica', 'Agua de Jamaica', 45, 1, people));
          items.push(makeItem('mix_semillas', 'Mix de Semillas', 60, 1, people));
        } else {
          items.push(makeItem('jugo_naranja', 'Jugo de Naranja (JUS Orgánico)', 60, 1, people));
          items.push(makeItem('cookies', 'Cookies', 50, 1, people));
          items.push(makeItem('ensalada_fruta', 'Ensalada de Fruta', 50, 1, people));
        }
      } else {
        // 8+ people
        if (level === 'economico') {
          items.push(makeItem('agua_bui', 'Agua Bui Natural', 50, 1, people));
          items.push(makeItem('agua_jamaica', 'Agua de Jamaica', 45, 1, people));
        } else if (level === 'balanceado') {
          items.push(makeItem('cafe_te', 'Café/Té Berlioz (caja 12 tazas)', 540, 1, cafeBoxes));
          items.push(makeItem('agua_bui', 'Agua Bui Natural', 50, 1, people));
        } else {
          items.push(makeItem('cafe_te', 'Café/Té Berlioz (caja 12 tazas)', 540, 1, cafeBoxes));
          items.push(makeItem('jugo_naranja', 'Jugo de Naranja (JUS Orgánico)', 60, 1, people));
          items.push(makeItem('agua_bui', 'Agua Bui Natural', 50, 1, people));
        }
      }
      return items;
    }

    // ──────────────────────────────────
    // BEVERAGES + SNACKS (2-3h)
    // ──────────────────────────────────
    if (durationBlock === 'beverages_snacks') {
      if (level === 'economico') {
        // CB PM or beverages + surtido snacks
        if (people >= 4) {
          const cbPmPrice = this.cbGroupPrice('cb_pm', people, 2800);
          items.push(makeItem('cb_pm', 'Coffee Break PM', cbPmPrice, 1, 1));
        } else {
          items.push(makeItem('agua_bui', 'Agua Bui Natural', 50, 1, people));
          items.push(makeItem('surtido_snacks', 'Surtido de Snacks', 300, 1, surtidoSets));
        }
      } else if (level === 'balanceado') {
        const cbAmPrice = this.cbGroupPrice('cb_am_cafe', people, 3250);
        items.push(makeItem('cb_am_cafe', 'Coffee Break AM - Café', cbAmPrice, 1, 1));
        items.push(makeItem('surtido_dulces', 'Surtido Dulces Mexicanos', 390, 1, surtidoSets));
      } else {
        const cbAmPrice = this.cbGroupPrice('cb_am_cafe', people, 3250);
        items.push(makeItem('cb_am_cafe', 'Coffee Break AM - Café', cbAmPrice, 1, 1));
        items.push(makeItem('surtido_camille', 'Surtido Camille (bocadillos gourmet)', 700, 1, surtidoSets));
        items.push(makeItem('cafe_te', 'Café/Té Berlioz (café caliente)', 540, 1, cafeBoxes));
      }
      return items;
    }

    // ──────────────────────────────────
    // FULL DAY (5+h) — special: desayuno + comida + coffee break
    // ──────────────────────────────────
    if (durationBlock === 'full_day') {
      return this.getFullDayItems(eventType, level, people, cafeBoxes, surtidoSets);
    }

    // ──────────────────────────────────
    // FULL FOOD (3-5h) — by event type
    // ──────────────────────────────────
    switch (eventType) {
      case 'desayuno':
        this.addDesayunoItems(items, level, people, cafeBoxes, surtidoSets);
        break;
      case 'coffee_break':
        this.addCoffeeBreakItems(items, level, people, cafeBoxes, surtidoSets);
        break;
      case 'comida':
        this.addWorkingLunchItems(items, level, people, cafeBoxes, surtidoSets);
        break;
      case 'evento_especial':
        this.addEventoEspecialItems(items, level, people, cafeBoxes, surtidoSets);
        break;
      case 'capacitacion':
        // Capacitación uses full_day logic regardless of duration
        return this.getFullDayItems(eventType, level, people, cafeBoxes, surtidoSets);
      case 'otro':
        this.addOtroItems(items, level, people, cafeBoxes, surtidoSets);
        break;
      default:
        this.addWorkingLunchItems(items, level, people, cafeBoxes, surtidoSets);
    }

    return items;
  }

  // ── DESAYUNO ──
  private addDesayunoItems(items: PackageItem[], level: string, people: number, cafeBoxes: number, surtidoSets: number) {
    if (level === 'economico') {
      // Esencial: sin bebidas
      if (people >= 20) {
        items.push(makeItem('desayuno_berlioz', 'Desayuno Berlioz', 170, 1, people));
      } else {
        items.push(makeItem('breakfast_bag', 'Breakfast Bag (Pavo)', 250, 1, people));
      }
    } else if (level === 'balanceado') {
      // Equilibrado: + bebidas básicas (agua Bui)
      items.push(makeItem('breakfast_roma', 'Breakfast in Roma', 290, 1, people));
      items.push(makeItem('ensalada_fruta', 'Ensalada de Fruta', 50, 1, people));
      items.push(makeItem('agua_bui', 'Agua Bui Natural', 50, 1, people));
      // >15 personas: complemento coffee break
      if (people > 15) {
        const cbAmPrice = this.cbGroupPrice('cb_am_cafe', people, 3250);
        items.push(makeItem('cb_am_cafe', 'Coffee Break AM (complemento)', cbAmPrice, 1, 1));
      }
    } else {
      // Premium: Café/Té + aguas + producto premium
      items.push(makeItem('breakfast_montreal', 'Breakfast in Montreal (Premium)', 410, 1, people));
      items.push(makeItem('ensalada_fruta', 'Ensalada de Fruta', 50, 1, people));
      items.push(makeItem('yogurt', 'Yogurt Orgánico', 50, 1, people));
      items.push(makeItem('cafe_te', 'Café/Té Berlioz (café caliente)', 540, 1, cafeBoxes));
      items.push(makeItem('agua_bui', 'Agua Bui Natural', 50, 1, people));
      if (people > 15) {
        items.push(makeItem('surtido_hugo', 'Surtido Hugo (pan dulce)', 550, 1, surtidoSets));
      }
    }
  }

  // ── COFFEE BREAK ──
  private addCoffeeBreakItems(items: PackageItem[], level: string, people: number, cafeBoxes: number, surtidoSets: number) {
    // ⚠️ CB pre-armado NO incluye café caliente
    if (level === 'economico') {
      const cbPmPrice = this.cbGroupPrice('cb_pm', people, 2800);
      items.push(makeItem('cb_pm', 'Coffee Break PM', cbPmPrice, 1, 1));
    } else if (level === 'balanceado') {
      const cbAmPrice = this.cbGroupPrice('cb_am_cafe', people, 3250);
      items.push(makeItem('cb_am_cafe', 'Coffee Break AM - Café', cbAmPrice, 1, 1));
      items.push(makeItem('surtido_dulces', 'Surtido Dulces Mexicanos', 390, 1, surtidoSets));
    } else {
      const cbAmPrice = this.cbGroupPrice('cb_am_cafe', people, 3250);
      items.push(makeItem('cb_am_cafe', 'Coffee Break AM - Café', cbAmPrice, 1, 1));
      items.push(makeItem('surtido_camille', 'Surtido Camille (bocadillos gourmet)', 700, 1, surtidoSets));
      // Upgrade: café caliente
      items.push(makeItem('cafe_te', 'Café/Té Berlioz (café caliente upgrade)', 540, 1, cafeBoxes));
    }
  }

  // ── WORKING LUNCH ──
  private addWorkingLunchItems(items: PackageItem[], level: string, people: number, cafeBoxes: number, _surtidoSets: number) {
    if (level === 'economico') {
      // Esencial: sin bebidas (precio base)
      if (people >= 20) {
        items.push(makeItem('comedor', 'Comedor Berlioz', 170, 1, people));
      } else {
        items.push(makeItem('mini_box', 'Mini Box', 170, 1, people));
      }
    } else if (level === 'balanceado') {
      // Equilibrado: + agua Bui incluida
      items.push(makeItem('golden_box', 'Golden Box', 330, 1, people));
      items.push(makeItem('agua_bui', 'Agua Bui Natural', 50, 1, people));
      items.push(makeItem('cookies', 'Cookies', 50, 1, people));
    } else {
      // Premium: Café/Té + aguas + producto premium
      items.push(makeItem('pink_box', 'Pink Box (pasta al pesto)', 370, 1, people));
      items.push(makeItem('cafe_te', 'Café/Té Berlioz (café caliente)', 540, 1, cafeBoxes));
      items.push(makeItem('agua_bui', 'Agua Bui Natural', 50, 1, people));
      items.push(makeItem('paleta', 'Paleta de Hielo', 45, 1, people));
    }
  }

  // ── EVENTO ESPECIAL (reunión ejecutiva) ──
  private addEventoEspecialItems(items: PackageItem[], level: string, people: number, cafeBoxes: number, surtidoSets: number) {
    // Premium boxes + mini surtidos + bebidas premium
    if (level === 'economico') {
      items.push(makeItem('black_box', 'Black Box', 330, 1, people));
    } else if (level === 'balanceado') {
      items.push(makeItem('pink_box', 'Pink Box (pasta al pesto)', 370, 1, people));
      items.push(makeItem('mini_camille', 'Mini Surtido Camille', 350, 1, surtidoSets));
      items.push(makeItem('agua_bui', 'Agua Bui Natural', 50, 1, people));
    } else {
      items.push(makeItem('salmon_box', 'Salmon Box', 410, 1, people));
      items.push(makeItem('mini_voltaire', 'Mini Surtido Voltaire', 350, 1, surtidoSets));
      items.push(makeItem('cafe_te', 'Café/Té Berlioz (café caliente)', 540, 1, cafeBoxes));
      items.push(makeItem('sanpellegrino', 'Sanpellegrino Aranciata', 50, 1, people));
    }
  }

  // ── OTRO ──
  private addOtroItems(items: PackageItem[], level: string, people: number, cafeBoxes: number, surtidoSets: number) {
    if (level === 'economico') {
      // Portable/bag options
      items.push(makeItem('lunch_bag', 'Lunch Bag Pasta Pollo', 250, 1, people));
    } else if (level === 'balanceado') {
      items.push(makeItem('black_box', 'Black Box', 330, 1, people));
      items.push(makeItem('agua_bui', 'Agua Bui Natural', 50, 1, people));
    } else {
      items.push(makeItem('salmon_box', 'Salmon Box', 410, 1, people));
      items.push(makeItem('surtido_camille', 'Surtido Camille (gourmet)', 700, 1, surtidoSets));
      items.push(makeItem('cafe_te', 'Café/Té Berlioz (café caliente)', 540, 1, cafeBoxes));
    }
  }

  // ── FULL DAY (5+h): desayuno + comida + coffee break ──
  private getFullDayItems(eventType: string, level: string, people: number, cafeBoxes: number, surtidoSets: number): PackageItem[] {
    const items: PackageItem[] = [];

    if (level === 'economico') {
      // Morning: breakfast bag or desayuno
      if (people >= 20) {
        items.push(makeItem('desayuno_berlioz', 'Desayuno Berlioz (mañana)', 170, 1, people));
      } else {
        items.push(makeItem('breakfast_bag', 'Breakfast Bag Pavo (mañana)', 250, 1, people));
      }
      // Midday: comedor or mini box
      if (people >= 20) {
        items.push(makeItem('comedor', 'Comedor Berlioz (mediodía)', 170, 1, people));
      } else {
        items.push(makeItem('mini_box', 'Mini Box (mediodía)', 170, 1, people));
      }
      // Afternoon: basic break
      items.push(makeItem('surtido_snacks', 'Surtido de Snacks (tarde)', 300, 1, surtidoSets));
      items.push(makeItem('agua_bui', 'Agua Bui Natural', 50, 1, people));
    } else if (level === 'balanceado') {
      // Morning: CB AM
      const cbAmPrice = this.cbGroupPrice('cb_am_cafe', people, 3250);
      items.push(makeItem('cb_am', 'Coffee Break AM - Café (mañana)', cbAmPrice, 1, 1));
      // Midday: Working Lunch
      items.push(makeItem('golden_box', 'Golden Box (mediodía)', 330, 1, people));
      items.push(makeItem('agua_bui', 'Agua Bui Natural', 50, 1, people));
      // Afternoon: CB PM
      const cbPmPrice = this.cbGroupPrice('cb_pm', people, 2800);
      items.push(makeItem('cb_pm', 'Coffee Break PM (tarde)', cbPmPrice, 1, 1));
    } else {
      // Morning: CB AM + café caliente
      const cbAmPrice = this.cbGroupPrice('cb_am_cafe', people, 3250);
      items.push(makeItem('cb_am', 'Coffee Break AM - Café (mañana)', cbAmPrice, 1, 1));
      items.push(makeItem('cafe_te', 'Café/Té Berlioz (café caliente)', 540, 1, cafeBoxes));
      // Midday: Premium lunch
      items.push(makeItem('pink_box', 'Pink Box (mediodía)', 370, 1, people));
      items.push(makeItem('agua_bui', 'Agua Bui Natural', 50, 1, people));
      // Afternoon: CB PM + surtido premium
      const cbPmPrice = this.cbGroupPrice('cb_pm', people, 2800);
      items.push(makeItem('cb_pm', 'Coffee Break PM (tarde)', cbPmPrice, 1, 1));
      items.push(makeItem('surtido_camille', 'Surtido Camille (bocadillos gourmet)', 700, 1, surtidoSets));
    }

    return items;
  }
}

function makeItem(code: string, name: string, unitPrice: number, qtyPerPerson: number, totalQty: number): PackageItem {
  return { code, name, unitPrice, qtyPerPerson, totalQty, subtotal: unitPrice * totalQty };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
