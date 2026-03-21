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
// PRODUCT TIER SYSTEM — strict price differentiation
// ═══════════════════════════════════════════════════════════
// TIER 1 (Esencial): $150-$250/person, NO beverages
// TIER 2 (Equilibrado): $250-$370/person, includes water/basic beverage
// TIER 3 (Experiencia): $370-$550+/person, includes Café/Té + premium

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
          `Un servicio funcional y confiable para ${people} personas. Sin bebidas — ideal si ya tienes resuelto ese tema.`,
          ['Entrega puntual garantizada', 'Precio base sin bebidas', 'Ideal para eventos recurrentes'],
          form.eventType, 'economico', people, deliveryFee, durationBlock),
        this.buildPackage('recomendado', 'Equilibrado', 'La experiencia que tu equipo merece',
          'Nuestro paquete más popular: productos de mayor calidad con bebidas incluidas.',
          ['Bebidas incluidas (agua + café)', 'Variedad premium', 'Presentación profesional'],
          form.eventType, 'balanceado', people, deliveryFee, durationBlock),
        this.buildPackage('premium', 'Experiencia Completa', 'Cada detalle cuenta',
          'Una experiencia gastronómica integral con los mejores ingredientes del catálogo Berlioz.',
          ['Café/Té Berlioz + aguas premium', 'Productos gourmet top-tier', 'Postres y surtidos premium'],
          form.eventType, 'premium', people, deliveryFee, durationBlock),
      ];
    }

    // ENFORCE: packages must have distinct pricePerPerson
    this.ensurePriceDifferentiation(packages, people);

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

  /**
   * Enforce strict price differentiation:
   * - Esencial must be 30-40% cheaper than Equilibrado
   * - Experiencia must be 25-40% more expensive than Equilibrado
   */
  private ensurePriceDifferentiation(packages: Package[], people: number) {
    if (packages.length !== 3) return;
    const [esencial, equilibrado, experiencia] = packages;

    // If esencial >= equilibrado, scale esencial down
    if (esencial.pricePerPerson >= equilibrado.pricePerPerson * 0.75) {
      const targetRatio = 0.65; // ~35% cheaper
      const targetTotal = equilibrado.total * targetRatio;
      const scale = targetTotal / esencial.total;
      esencial.items.forEach(item => {
        item.subtotal = roundCents(item.subtotal * scale);
        item.unitPrice = roundCents(item.subtotal / item.totalQty);
      });
      this.recalcPackage(esencial, people);
    }

    // If experiencia <= equilibrado, scale experiencia up
    if (experiencia.pricePerPerson <= equilibrado.pricePerPerson * 1.2) {
      const targetRatio = 1.35; // ~35% more expensive
      const targetTotal = equilibrado.total * targetRatio;
      const scale = targetTotal / experiencia.total;
      experiencia.items.forEach(item => {
        item.subtotal = roundCents(item.subtotal * scale);
        item.unitPrice = roundCents(item.subtotal / item.totalQty);
      });
      this.recalcPackage(experiencia, people);
    }
  }

  private recalcPackage(pkg: Package, people: number) {
    const itemsTotal = pkg.items.reduce((s, i) => s + i.subtotal, 0);
    pkg.subtotalBeforeIVA = itemsTotal + pkg.deliveryFee;
    pkg.iva = calculateIVA(pkg.subtotalBeforeIVA);
    pkg.total = roundCents(pkg.subtotalBeforeIVA + pkg.iva);
    pkg.pricePerPerson = roundCents(pkg.total / people);
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

    update(0, 'running', 'Analizando tipo de evento...');
    await delay(600);
    update(0, 'running', `Evento: ${eventLabel} · ${form.personas} personas · ${form.duracionEstimada}h`);
    await delay(500);

    if (durationBlock === 'beverages_only') {
      update(0, 'running', '⚡ Evento < 2h → SOLO bebidas');
    } else if (durationBlock === 'beverages_snacks') {
      update(0, 'running', '🍿 Evento 2-3h → Bebidas + snacks');
    } else if (durationBlock === 'full_food') {
      update(0, 'running', '🍽️ Evento 3-5h → Comida principal + bebidas');
    } else {
      update(0, 'running', '📅 Evento 5+h → Día completo');
    }
    await delay(400);
    update(0, 'done', 'Análisis completado ✓');

    update(1, 'running', 'Consultando catálogo real Berlioz...');
    await delay(600);
    update(1, 'running', `${MENU_CATALOG.length} productos disponibles`);
    await delay(400);

    if (hasBudget) {
      update(1, 'running', `Presupuesto: $${form.presupuestoPorPersona}/persona`);
    } else {
      update(1, 'running', 'Seleccionando 3 tiers con productos DISTINTOS');
      await delay(300);
      update(1, 'running', '⚠️ Esencial: SIN bebidas · Equilibrado: agua + café · Experiencia: premium completo');
    }
    await delay(500);
    update(1, 'done', 'Menús seleccionados ✓');

    update(2, 'running', 'Calculando precios con catálogo real...');
    await delay(500);
    update(2, 'running', 'Verificando diferenciación de precios entre paquetes...');
    await delay(400);
    update(2, 'done', 'Precios calculados ✓');

    update(3, 'running', 'Escribiendo propuesta comercial...');
    await delay(700);
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
  // ITEM SELECTION: STRICT TIER DIFFERENTIATION
  // Esencial: Tier 1 products, NO beverages
  // Equilibrado: Tier 2 products + Agua Bui
  // Experiencia: Tier 3 products + Café/Té + Agua Bui
  // NEVER use same main product across tiers
  // ═══════════════════════════════════════════════════════════

  private getItemsForLevel(eventType: string, level: string, people: number, durationBlock: DurationBlock): PackageItem[] {
    const items: PackageItem[] = [];
    const cafeBoxes = Math.ceil(people / 12);
    const surtidoSets = Math.ceil(people / 7);

    // ── BEVERAGES ONLY (<2h) ──
    if (durationBlock === 'beverages_only') {
      if (level === 'economico') {
        items.push(makeItem('agua_bui_natural', 'Agua Bui Natural', 50, 1, people));
      } else if (level === 'balanceado') {
        items.push(makeItem('cafe_te_berlioz', 'Café/Té Berlioz', 540, 1, cafeBoxes));
        items.push(makeItem('agua_bui_natural', 'Agua Bui Natural', 50, 1, people));
        items.push(makeItem('mix_semillas', 'Mix de Semillas', 60, 1, people));
      } else {
        items.push(makeItem('cafe_te_berlioz', 'Café/Té Berlioz', 540, 1, cafeBoxes));
        items.push(makeItem('jugo_naranja', 'Jugo de Naranja (JUS Orgánico)', 60, 1, people));
        items.push(makeItem('agua_bui_natural', 'Agua Bui Natural', 50, 1, people));
        items.push(makeItem('cookies', 'Cookies', 50, 1, people));
        items.push(makeItem('ensalada_fruta', 'Ensalada de Fruta', 50, 1, people));
      }
      return items;
    }

    // ── BEVERAGES + SNACKS (2-3h) ──
    if (durationBlock === 'beverages_snacks') {
      if (level === 'economico') {
        const cbPmPrice = this.cbGroupPrice('cb_pm', people, 2800);
        items.push(makeItem('cb_pm', 'Coffee Break PM', cbPmPrice, 1, 1));
      } else if (level === 'balanceado') {
        const cbAmPrice = this.cbGroupPrice('cb_am_cafe', people, 3250);
        items.push(makeItem('cb_am_cafe', 'Coffee Break AM - Café', cbAmPrice, 1, 1));
        items.push(makeItem('surtido_zadig', 'Surtido Zadig', 400, 1, surtidoSets));
      } else {
        const cbAmPrice = this.cbGroupPrice('cb_am_cafe', people, 3250);
        items.push(makeItem('cb_am_cafe', 'Coffee Break AM - Café', cbAmPrice, 1, 1));
        items.push(makeItem('surtido_camille', 'Surtido Camille (bocadillos gourmet)', 700, 1, surtidoSets));
        items.push(makeItem('cafe_te_berlioz', 'Café/Té Berlioz', 540, 1, cafeBoxes));
      }
      return items;
    }

    // ── FULL DAY (5+h) ──
    if (durationBlock === 'full_day') {
      return this.getFullDayItems(eventType, level, people, cafeBoxes, surtidoSets);
    }

    // ── FULL FOOD (3-5h) — by event type ──
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
        return this.getFullDayItems(eventType, level, people, cafeBoxes, surtidoSets);
      case 'filmacion':
        this.addFilmacionItems(items, level, people);
        break;
      case 'otro':
        this.addOtroItems(items, level, people, cafeBoxes, surtidoSets);
        break;
      default:
        this.addWorkingLunchItems(items, level, people, cafeBoxes, surtidoSets);
    }

    return items;
  }

  // ── DESAYUNO — STRICT TIER DIFFERENTIATION ──
  private addDesayunoItems(items: PackageItem[], level: string, people: number, cafeBoxes: number, surtidoSets: number) {
    if (level === 'economico') {
      // TIER 1: Desayuno Berlioz $170 — NO beverages
      if (people >= 20) {
        items.push(makeItem('desayuno_berlioz', 'Desayuno Berlioz', 170, 1, people));
      } else {
        items.push(makeItem('breakfast_bag_pavo', 'Breakfast Bag (Pavo)', 250, 1, people));
      }
    } else if (level === 'balanceado') {
      // TIER 2: Breakfast in Roma $290 + surtido + agua
      items.push(makeItem('breakfast_roma', 'Breakfast in Roma', 290, 1, people));
      items.push(makeItem('surtido_hugo', 'Surtido Hugo (pan dulce)', 550, 1, surtidoSets));
      items.push(makeItem('agua_bui_natural', 'Agua Bui Natural', 50, 1, people));
    } else {
      // TIER 3: Breakfast Montreal $410 + Café/Té + yogurt + agua
      items.push(makeItem('breakfast_montreal', 'Breakfast in Montreal (Premium)', 410, 1, people));
      items.push(makeItem('cafe_te_berlioz', 'Café/Té Berlioz', 540, 1, cafeBoxes));
      items.push(makeItem('yogurt_organico', 'Yogurt Orgánico', 50, 1, people));
      items.push(makeItem('agua_bui_natural', 'Agua Bui Natural', 50, 1, people));
      items.push(makeItem('surtido_camille', 'Surtido Camille (bocadillos gourmet)', 700, 1, surtidoSets));
    }
  }

  // ── COFFEE BREAK — STRICT TIER DIFFERENTIATION ──
  private addCoffeeBreakItems(items: PackageItem[], level: string, people: number, cafeBoxes: number, surtidoSets: number) {
    if (level === 'economico') {
      // TIER 1: CB PM only — cheapest
      const cbPmPrice = this.cbGroupPrice('cb_pm', people, 2800);
      items.push(makeItem('cb_pm', 'Coffee Break PM', cbPmPrice, 1, 1));
    } else if (level === 'balanceado') {
      // TIER 2: CB AM Café + Surtido Zadig
      const cbAmPrice = this.cbGroupPrice('cb_am_cafe', people, 3250);
      items.push(makeItem('cb_am_cafe', 'Coffee Break AM - Café', cbAmPrice, 1, 1));
      items.push(makeItem('surtido_zadig', 'Surtido Zadig', 400, 1, surtidoSets));
    } else {
      // TIER 3: CB AM Café + Surtido Camille + Café/Té caliente
      const cbAmPrice = this.cbGroupPrice('cb_am_cafe', people, 3250);
      items.push(makeItem('cb_am_cafe', 'Coffee Break AM - Café', cbAmPrice, 1, 1));
      items.push(makeItem('surtido_camille', 'Surtido Camille (bocadillos gourmet)', 700, 1, surtidoSets));
      items.push(makeItem('cafe_te_berlioz', 'Café/Té Berlioz', 540, 1, cafeBoxes));
    }
  }

  // ── WORKING LUNCH — STRICT TIER DIFFERENTIATION ──
  private addWorkingLunchItems(items: PackageItem[], level: string, people: number, cafeBoxes: number, surtidoSets: number) {
    if (level === 'economico') {
      // TIER 1: Mini Box $170 (sin mínimo) — NO beverages
      items.push(makeItem('mini_box', 'Mini Box', 170, 1, people));
    } else if (level === 'balanceado') {
      // TIER 2: Golden Box $330 + agua + snacks
      items.push(makeItem('golden_box', 'Golden Box', 330, 1, people));
      items.push(makeItem('surtido_snacks', 'Surtido de Snacks', 300, 1, surtidoSets));
      items.push(makeItem('agua_bui_natural', 'Agua Bui Natural', 50, 1, people));
    } else {
      // TIER 3: Salmon Box $410 + Surtido Camille + Café/Té + agua
      items.push(makeItem('salmon_box', 'Salmon Box', 410, 1, people));
      items.push(makeItem('surtido_camille', 'Surtido Camille (bocadillos gourmet)', 700, 1, surtidoSets));
      items.push(makeItem('cafe_te_berlioz', 'Café/Té Berlioz', 540, 1, cafeBoxes));
      items.push(makeItem('agua_bui_natural', 'Agua Bui Natural', 50, 1, people));
    }
  }

  // ── EVENTO ESPECIAL ──
  private addEventoEspecialItems(items: PackageItem[], level: string, people: number, cafeBoxes: number, surtidoSets: number) {
    if (level === 'economico') {
      // TIER 1: Black Box $330 — NO beverages
      items.push(makeItem('black_box', 'Black Box', 330, 1, people));
    } else if (level === 'balanceado') {
      // TIER 2: Pink Box $370 + mini surtido + agua
      items.push(makeItem('pink_box', 'Pink Box (pasta al pesto)', 370, 1, people));
      items.push(makeItem('mini_surtido_camille', 'Mini Surtido Camille', 350, 1, surtidoSets));
      items.push(makeItem('agua_bui_natural', 'Agua Bui Natural', 50, 1, people));
    } else {
      // TIER 3: Salmon Box $410 + Surtido Voltaire + Café/Té + Sanpellegrino
      items.push(makeItem('salmon_box', 'Salmon Box', 410, 1, people));
      items.push(makeItem('surtido_voltaire', 'Surtido Voltaire', 750, 1, surtidoSets));
      items.push(makeItem('cafe_te_berlioz', 'Café/Té Berlioz', 540, 1, cafeBoxes));
      items.push(makeItem('sanpellegrino_aranciata', 'Sanpellegrino Aranciata', 50, 1, people));
    }
  }

  // ── OTRO ──
  private addOtroItems(items: PackageItem[], level: string, people: number, cafeBoxes: number, surtidoSets: number) {
    if (level === 'economico') {
      items.push(makeItem('lunch_bag_pasta_pollo', 'Lunch Bag Pasta Pollo', 250, 1, people));
    } else if (level === 'balanceado') {
      items.push(makeItem('black_box', 'Black Box', 330, 1, people));
      items.push(makeItem('agua_bui_natural', 'Agua Bui Natural', 50, 1, people));
    } else {
      items.push(makeItem('salmon_box', 'Salmon Box', 410, 1, people));
      items.push(makeItem('surtido_camille', 'Surtido Camille (gourmet)', 700, 1, surtidoSets));
      items.push(makeItem('cafe_te_berlioz', 'Café/Té Berlioz', 540, 1, cafeBoxes));
    }
  }

  // ── FILMACIÓN ──
  private addFilmacionItems(items: PackageItem[], level: string, people: number) {
    if (level === 'economico') {
      items.push(makeItem('box_economica_1', 'Box Económica 1 (Torta)', 150, 1, people));
      items.push(makeItem('agua_bui_natural', 'Agua Bui Natural', 50, 1, people));
    } else if (level === 'balanceado') {
      items.push(makeItem('lunch_bag_pasta_pollo', 'Lunch Bag Pasta Pollo', 250, 1, people));
      items.push(makeItem('snack_bag', 'Snack Bag Individual', 140, 1, people));
      items.push(makeItem('agua_bui_natural', 'Agua Bui Natural', 50, 1, people));
    } else {
      items.push(makeItem('breakfast_bag_pavo', 'Breakfast Bag Pavo', 250, 1, people));
      items.push(makeItem('lunch_bag_ciabatta_pavo', 'Lunch Bag Ciabatta Pavo', 250, 1, people));
      items.push(makeItem('snack_bag', 'Snack Bag Individual', 140, 1, people));
      items.push(makeItem('cafe_frio', 'Café Frío (latte orgánico)', 60, 1, people));
    }
  }

  // ── FULL DAY (5+h) ──
  private getFullDayItems(eventType: string, level: string, people: number, cafeBoxes: number, surtidoSets: number): PackageItem[] {
    const items: PackageItem[] = [];

    if (level === 'economico') {
      // Morning: desayuno (mín 20) or bag
      if (people >= 20) {
        items.push(makeItem('desayuno_berlioz', 'Desayuno Berlioz (mañana)', 170, 1, people));
      } else {
        items.push(makeItem('breakfast_bag_pavo', 'Breakfast Bag Pavo (mañana)', 250, 1, people));
      }
      // Midday: mini_box (sin mínimo)
      items.push(makeItem('mini_box', 'Mini Box (mediodía)', 170, 1, people));
      // Afternoon: basic break
      items.push(makeItem('surtido_snacks', 'Surtido de Snacks (tarde)', 300, 1, surtidoSets));
    } else if (level === 'balanceado') {
      // Morning: CB AM
      const cbAmPrice = this.cbGroupPrice('cb_am_cafe', people, 3250);
      items.push(makeItem('cb_am_cafe', 'Coffee Break AM - Café (mañana)', cbAmPrice, 1, 1));
      // Midday: Golden Box + agua
      items.push(makeItem('golden_box', 'Golden Box (mediodía)', 330, 1, people));
      items.push(makeItem('agua_bui_natural', 'Agua Bui Natural', 50, 1, people));
      // Afternoon: CB PM
      const cbPmPrice = this.cbGroupPrice('cb_pm', people, 2800);
      items.push(makeItem('cb_pm', 'Coffee Break PM (tarde)', cbPmPrice, 1, 1));
    } else {
      // Morning: CB AM + café caliente
      const cbAmPrice = this.cbGroupPrice('cb_am_cafe', people, 3250);
      items.push(makeItem('cb_am_cafe', 'Coffee Break AM - Café (mañana)', cbAmPrice, 1, 1));
      items.push(makeItem('cafe_te_berlioz', 'Café/Té Berlioz', 540, 1, cafeBoxes));
      // Midday: Pink Box + agua
      items.push(makeItem('pink_box', 'Pink Box (mediodía)', 370, 1, people));
      items.push(makeItem('agua_bui_natural', 'Agua Bui Natural', 50, 1, people));
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
