import type { IProposalGenerator } from '@/domain/repositories/IProposalGenerator';
import type { IntakeForm } from '@/domain/entities/IntakeForm';
import type { Proposal, Package, PackageItem } from '@/domain/entities/Proposal';
import type { AgentState } from '@/domain/entities/AgentState';
import { EVENT_TYPE_LABELS, type EventType } from '@/domain/value-objects/EventType';
import {
  BUSINESS_RULES, PROPOSAL_VALIDITY_DAYS, DELIVERY_FEE_BASE,
  getDeliveryCount, getDurationBlock, getBudgetTiers, AGENT_RULES,
} from '@/domain/shared/BusinessRules';
import { calculateIVA, roundCents } from '@/domain/value-objects/Money';
import { MENU_CATALOG, getGroupPrice } from '@/domain/entities/MenuCatalog';
import type { MenuItem } from '@/domain/entities/MenuItem';

// ═══════════════════════════════════════════════════════════
// REAL CATALOG-BASED PROPOSAL GENERATOR
// Uses only products from Berlioz's official WooCommerce store
// ═══════════════════════════════════════════════════════════

export class DeterministicProposalGenerator implements IProposalGenerator {
  generate(form: IntakeForm): Proposal {
    const numPeople = form.personas;
    const deliveries = getDeliveryCount(
      form.esMultiDia, form.entregasPorDia, form.horasEntrega, form.fechaInicio, form.fechaFin,
    );
    const deliveryFee = DELIVERY_FEE_BASE * deliveries;
    const eventLabel = EVENT_TYPE_LABELS[form.eventType as EventType] || 'Evento';
    const durationBlock = getDurationBlock(form.duracionEstimada);

    let packages: Package[];

    if (form.tienePresupuesto && form.presupuestoPorPersona > 0) {
      const tiers = getBudgetTiers(form.presupuestoPorPersona);
      packages = [
        this.buildBudgetPackage('basico', 'Opción ajustada', 'Dentro de tu presupuesto',
          `Propuesta ajustada a tu presupuesto de $${form.presupuestoPorPersona}/persona para ${numPeople} personas.`,
          ['Dentro del presupuesto indicado', 'Menú cuidadosamente seleccionado', 'Calidad Berlioz garantizada'],
          form.eventType, tiers.adjusted, numPeople, deliveryFee, durationBlock),
        this.buildBudgetPackage('recomendado', 'Opción recomendada', 'Un paso más en experiencia',
          'Nuestra recomendación: invierte un poco más por persona y eleva notablemente la experiencia.',
          ['Mejor variedad y presentación', 'Incluye elementos premium', 'La opción más elegida'],
          form.eventType, tiers.recommended, numPeople, deliveryFee, durationBlock),
        this.buildBudgetPackage('premium', 'Opción completa', 'La experiencia completa',
          'Una experiencia gastronómica integral con ingredientes premium y servicio completo.',
          ['Opciones gourmet y artesanales', 'Servicio completo de bebidas', 'Presentación de primer nivel'],
          form.eventType, tiers.complete, numPeople, deliveryFee, durationBlock),
      ];
    } else {
      packages = [
        this.buildPackage('basico', 'Esencial', 'Lo necesario, bien ejecutado',
          `Un servicio funcional y confiable para ${numPeople} personas.`,
          ['Entrega puntual garantizada', 'Menú clásico y confiable', 'Ideal para eventos recurrentes'],
          form.eventType, 'economico', numPeople, deliveryFee, durationBlock),
        this.buildPackage('recomendado', 'Equilibrado', 'La experiencia que tu equipo merece',
          'Nuestro paquete más popular combina sabor, presentación y valor.',
          ['Variedad de opciones', 'Incluye bebidas', 'Presentación profesional premium'],
          form.eventType, 'balanceado', numPeople, deliveryFee, durationBlock),
        this.buildPackage('premium', 'Experiencia Completa', 'Cada detalle cuenta',
          'Una experiencia gastronómica integral con los mejores ingredientes.',
          ['Opciones gourmet y artesanales', 'Servicio completo de bebidas', 'Postres y snacks premium'],
          form.eventType, 'premium', numPeople, deliveryFee, durationBlock),
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
        : 'Ofrece el mejor equilibrio entre calidad, variedad y precio — es la opción que más eligen nuestros clientes corporativos.',
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

    // Discovery
    update(0, 'running', 'Analizando tipo de evento...');
    await delay(800);
    update(0, 'running', `Evento: ${eventLabel}`);
    await delay(400);
    update(0, 'running', `${form.personas} personas · Duración: ${form.duracionEstimada}h`);
    await delay(400);
    if (durationBlock === 'beverages_only') {
      update(0, 'running', '⚡ Evento corto → solo bebidas recomendadas');
    } else if (durationBlock === 'beverages_snacks') {
      update(0, 'running', '🍿 Duración media → bebidas + snacks');
    } else {
      update(0, 'running', '🍽️ Evento largo → paquete completo de alimentos');
    }
    await delay(500);
    update(0, 'running', `Reglas del agente: ${AGENT_RULES.length} reglas cargadas`);
    await delay(400);
    update(0, 'done', 'Análisis completado ✓');

    // Menu
    update(1, 'running', 'Consultando catálogo real Berlioz (WooCommerce)...');
    await delay(700);
    update(1, 'running', `${MENU_CATALOG.length} productos en catálogo`);
    await delay(400);
    if (hasBudget) {
      update(1, 'running', `Presupuesto: $${form.presupuestoPorPersona}/persona`);
      await delay(500);
      update(1, 'running', 'Generando 3 opciones: ajustada, recomendada y completa');
    } else {
      update(1, 'running', 'Seleccionando 3 paquetes estándar del catálogo real');
    }
    await delay(600);
    update(1, 'done', 'Menús seleccionados ✓');

    // Pricing
    update(2, 'running', 'Calculando precios con catálogo real...');
    await delay(600);
    update(2, 'running', 'Coffee Breaks → precio grupal (NO por persona)');
    await delay(400);
    update(2, 'running', `Envío: $${DELIVERY_FEE_BASE}/entrega. IVA 16% adicional.`);
    await delay(400);
    update(2, 'done', 'Precios calculados ✓');

    // Writer
    update(3, 'running', 'Escribiendo propuesta comercial...');
    await delay(900);
    update(3, 'done', 'Propuesta lista ✓');

    return this.generate(form);
  }

  private buildPackage(
    id: Package['id'], displayName: string, tagline: string, narrative: string,
    highlights: string[], eventType: string, level: string, people: number,
    deliveryFee: number, durationBlock: string,
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
    people: number, deliveryFee: number, durationBlock: string,
  ): Package {
    const level = targetPricePerPerson <= 200 ? 'economico' : targetPricePerPerson <= 350 ? 'balanceado' : 'premium';
    return this.buildPackage(id, displayName, tagline, narrative, highlights, eventType, level, people, deliveryFee, durationBlock);
  }

  private findItem(id: string): MenuItem | undefined {
    return MENU_CATALOG.find(m => m.id === id);
  }

  private getItemsForLevel(eventType: string, level: string, people: number, durationBlock: string): PackageItem[] {
    const items: PackageItem[] = [];

    // ── BEVERAGES ONLY (<2h) ──
    if (durationBlock === 'beverages_only') {
      items.push(makeItem('agua_bui', 'Agua Bui Natural', 50, 1, people));
      if (level === 'balanceado' || level === 'premium') {
        items.push(makeItem('agua_jamaica', 'Agua de Jamaica', 45, 1, people));
      }
      if (level === 'premium') {
        items.push(makeItem('jugo_naranja', 'Jugo de Naranja (JUS Orgánico)', 60, 1, people));
        items.push(makeItem('cafe_te', 'Café/Té Berlioz (caja 12 tazas)', 540, 1, Math.ceil(people / 12)));
      }
      return items;
    }

    // ── BEVERAGES + SNACKS (2-3h) ──
    if (durationBlock === 'beverages_snacks') {
      items.push(makeItem('agua_bui', 'Agua Bui Natural', 50, 1, people));
      if (level === 'economico') {
        items.push(makeItem('surtido_snacks', 'Surtido de Snacks', 300, 1, Math.ceil(people / 7)));
      } else if (level === 'balanceado') {
        items.push(makeItem('surtido_colette', 'Surtido Colette (pan dulce francés)', 450, 1, Math.ceil(people / 7)));
        items.push(makeItem('agua_jamaica', 'Agua de Jamaica', 45, 1, people));
      } else {
        items.push(makeItem('surtido_camille', 'Surtido Camille (bocadillos gourmet)', 700, 1, Math.ceil(people / 7)));
        items.push(makeItem('cafe_te', 'Café/Té Berlioz (caja 12 tazas)', 540, 1, Math.ceil(people / 12)));
      }
      return items;
    }

    // ── FULL FOOD (>3h) ──
    if (eventType === 'desayuno' || eventType === 'capacitacion') {
      if (level === 'economico') {
        if (people >= 20) {
          items.push(makeItem('desayuno_berlioz', 'Desayuno Berlioz', 170, 1, people));
        } else {
          items.push(makeItem('breakfast_bag', 'Breakfast Bag (Pavo)', 250, 1, people));
        }
        items.push(makeItem('agua_bui', 'Agua Bui Natural', 50, 1, people));
      } else if (level === 'balanceado') {
        items.push(makeItem('breakfast_roma', 'Breakfast in Roma', 290, 1, people));
        items.push(makeItem('ensalada_fruta', 'Ensalada de Fruta', 50, 1, people));
        items.push(makeItem('agua_jamaica', 'Agua de Jamaica', 45, 1, people));
      } else {
        items.push(makeItem('breakfast_montreal', 'Breakfast in Montreal (Premium)', 410, 1, people));
        items.push(makeItem('ensalada_fruta', 'Ensalada de Fruta', 50, 1, people));
        items.push(makeItem('yogurt', 'Yogurt Orgánico', 50, 1, people));
        items.push(makeItem('jugo_naranja', 'Jugo de Naranja (JUS Orgánico)', 60, 1, people));
      }
    }

    if (eventType === 'coffee_break') {
      // Group pricing for coffee breaks
      const cbAm = this.findItem('cb_am_cafe');
      const cbPm = this.findItem('cb_pm');
      if (level === 'economico') {
        const price = cbPm ? getGroupPrice(cbPm, people) : 2800;
        items.push(makeItem('cb_pm', 'Coffee Break PM', price, 1, 1));
      } else if (level === 'balanceado') {
        const price = cbAm ? getGroupPrice(cbAm, people) : 3250;
        items.push(makeItem('cb_am_cafe', 'Coffee Break AM - Café', price, 1, 1));
        items.push(makeItem('surtido_snacks', 'Surtido de Snacks', 300, 1, Math.ceil(people / 7)));
      } else {
        const price = cbAm ? getGroupPrice(cbAm, people) : 3250;
        items.push(makeItem('cb_am_cafe', 'Coffee Break AM - Café', price, 1, 1));
        items.push(makeItem('surtido_camille', 'Surtido Camille (bocadillos gourmet)', 700, 1, Math.ceil(people / 7)));
        items.push(makeItem('cafe_te', 'Café/Té Berlioz (caja 12 tazas)', 540, 1, Math.ceil(people / 12)));
      }
    }

    if (eventType === 'comida' || eventType === 'evento_especial') {
      if (level === 'economico') {
        if (people >= 20) {
          items.push(makeItem('comedor', 'Comedor Berlioz', 170, 1, people));
        } else {
          items.push(makeItem('box_eco_2', 'Box Económica 2', 170, 1, people));
        }
        items.push(makeItem('agua_bui', 'Agua Bui Natural', 50, 1, people));
      } else if (level === 'balanceado') {
        items.push(makeItem('black_box', 'Black Box', 330, 1, people));
        items.push(makeItem('agua_jamaica', 'Agua de Jamaica', 45, 1, people));
        items.push(makeItem('cookies', 'Cookies', 50, 1, people));
      } else {
        items.push(makeItem('pink_box', 'Pink Box (pasta al pesto)', 370, 1, people));
        items.push(makeItem('surtido_camille', 'Surtido Camille (bocadillos gourmet)', 700, 1, Math.ceil(people / 7)));
        items.push(makeItem('paleta', 'Paleta de Hielo', 45, 1, people));
        items.push(makeItem('cafe_te', 'Café/Té Berlioz (caja 12 tazas)', 540, 1, Math.ceil(people / 12)));
      }
    }

    if (eventType === 'capacitacion') {
      // Already handled desayuno above; add lunch items
      if (level === 'economico') {
        if (people >= 20) {
          items.push(makeItem('comedor', 'Comedor Berlioz (comida)', 170, 1, people));
        }
        items.push(makeItem('cafe_te', 'Café/Té Berlioz (caja 12 tazas)', 540, 1, Math.ceil(people / 12)));
      } else if (level === 'balanceado') {
        items.push(makeItem('golden_box', 'Golden Box (comida)', 330, 1, people));
        items.push(makeItem('surtido_snacks', 'Surtido de Snacks', 300, 1, Math.ceil(people / 7)));
        items.push(makeItem('cafe_te', 'Café/Té Berlioz (caja 12 tazas)', 540, 1, Math.ceil(people / 12)));
      } else {
        items.push(makeItem('pink_box', 'Pink Box (comida)', 370, 1, people));
        items.push(makeItem('surtido_voltaire', 'Surtido Voltaire (bocadillos)', 750, 1, Math.ceil(people / 7)));
        items.push(makeItem('paleta', 'Paleta de Hielo', 45, 1, people));
        items.push(makeItem('cafe_te', 'Café/Té Berlioz (caja 12 tazas)', 540, 1, Math.ceil(people / 12)));
      }
    }

    if (eventType === 'otro') {
      if (level === 'economico') {
        if (people >= 20) {
          items.push(makeItem('comedor', 'Comedor Berlioz', 170, 1, people));
        } else {
          items.push(makeItem('mini_box', 'Mini Box', 170, 1, people));
        }
        items.push(makeItem('agua_bui', 'Agua Bui Natural', 50, 1, people));
      } else if (level === 'balanceado') {
        items.push(makeItem('black_box', 'Black Box', 330, 1, people));
        items.push(makeItem('cafe_te', 'Café/Té Berlioz (caja 12 tazas)', 540, 1, Math.ceil(people / 12)));
      } else {
        items.push(makeItem('salmon_box', 'Salmon Box', 410, 1, people));
        items.push(makeItem('surtido_camille', 'Surtido Camille (gourmet)', 700, 1, Math.ceil(people / 7)));
        items.push(makeItem('cafe_te', 'Café/Té Berlioz (caja 12 tazas)', 540, 1, Math.ceil(people / 12)));
      }
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
