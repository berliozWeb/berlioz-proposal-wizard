import type { IProposalGenerator } from '@/domain/repositories/IProposalGenerator';
import type { IntakeForm } from '@/domain/entities/IntakeForm';
import type { Proposal, Package, PackageItem } from '@/domain/entities/Proposal';
import type { AgentState } from '@/domain/entities/AgentState';
import { EVENT_TYPE_LABELS, type EventType } from '@/domain/value-objects/EventType';
import {
  BUSINESS_RULES, PROPOSAL_VALIDITY_DAYS, DELIVERY_FEE_PER_TRIP,
  getDeliveryCount, getDurationBlock, getBudgetTiers,
} from '@/domain/shared/BusinessRules';
import { calculateIVA, roundCents } from '@/domain/value-objects/Money';

export class DeterministicProposalGenerator implements IProposalGenerator {
  generate(form: IntakeForm): Proposal {
    const numPeople = form.personas;
    const deliveries = getDeliveryCount(
      form.esMultiDia, form.entregasPorDia, form.horasEntrega, form.fechaInicio, form.fechaFin,
    );
    const deliveryFee = DELIVERY_FEE_PER_TRIP * deliveries;
    const eventLabel = EVENT_TYPE_LABELS[form.eventType as EventType] || 'Evento';
    const durationBlock = getDurationBlock(form.duracionEstimada);

    let packages: Package[];

    if (form.tienePresupuesto && form.presupuestoPorPersona > 0) {
      // Rule 2: Budget-based 3 tiers
      const tiers = getBudgetTiers(form.presupuestoPorPersona);
      packages = [
        this.buildBudgetPackage('basico', 'Opción ajustada', 'Dentro de tu presupuesto',
          `Propuesta ajustada a tu presupuesto de $${form.presupuestoPorPersona}/persona para ${numPeople} personas.`,
          ['Dentro del presupuesto indicado', 'Menú cuidadosamente seleccionado', 'Calidad Berlioz garantizada'],
          form.eventType, tiers.adjusted, numPeople, deliveryFee, durationBlock),
        this.buildBudgetPackage('recomendado', 'Opción recomendada', 'Un paso más en experiencia',
          'Nuestra recomendación: invierte un poco más por persona y eleva notablemente la experiencia gastronómica de tu equipo.',
          ['Mejor variedad y presentación', 'Incluye elementos premium', 'La opción más elegida por nuestros clientes'],
          form.eventType, tiers.recommended, numPeople, deliveryFee, durationBlock),
        this.buildBudgetPackage('premium', 'Opción completa', 'La experiencia completa',
          'Una experiencia gastronómica integral con ingredientes premium y servicio completo. Para cuando quieres impresionar.',
          ['Opciones gourmet y artesanales', 'Servicio completo de bebidas', 'Presentación de primer nivel'],
          form.eventType, tiers.complete, numPeople, deliveryFee, durationBlock),
      ];
    } else {
      // Default 3 packages
      packages = [
        this.buildPackage('basico', 'Esencial', 'Lo necesario, bien ejecutado',
          `Un servicio funcional y confiable para ${numPeople} personas.`,
          ['Entrega puntual garantizada', 'Menú clásico y confiable', 'Ideal para eventos recurrentes'],
          form.eventType, 'economico', numPeople, deliveryFee, durationBlock),
        this.buildPackage('recomendado', 'Equilibrado', 'La experiencia que tu equipo merece',
          'Nuestro paquete más popular combina sabor, presentación y valor.',
          ['Variedad de opciones por persona', 'Incluye bebidas y snacks', 'Presentación profesional premium'],
          form.eventType, 'balanceado', numPeople, deliveryFee, durationBlock),
        this.buildPackage('premium', 'Experiencia Completa', 'Cada detalle cuenta',
          'Una experiencia gastronómica integral con los mejores ingredientes.',
          ['Opciones gourmet y artesanales', 'Servicio completo de bebidas', 'Postres y snacks premium incluidos'],
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

    // Discovery agent — Rule 3: duration determines product block
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
    if (form.codigoPostal) {
      update(0, 'running', `CP: ${form.codigoPostal} — verificando cobertura`);
      await delay(400);
    }
    update(0, 'done', 'Análisis completado ✓');

    // Menu agent
    update(1, 'running', 'Consultando catálogo Berlioz...');
    await delay(700);
    if (hasBudget) {
      update(1, 'running', `Presupuesto: $${form.presupuestoPorPersona}/persona`);
      await delay(500);
      update(1, 'running', 'Generando 3 opciones: ajustada, recomendada y completa');
    } else {
      update(1, 'running', 'Seleccionando 3 paquetes estándar');
    }
    await delay(600);
    update(1, 'done', 'Menús seleccionados ✓');

    // Pricing agent
    update(2, 'running', 'Calculando precios unitarios...');
    await delay(600);
    update(2, 'running', 'Aplicando reglas de negocio...');
    await delay(500);
    update(2, 'running', 'Precios excluyen IVA, envío y recargos');
    await delay(400);
    update(2, 'done', 'Precios calculados ✓');

    // Writer agent
    update(3, 'running', 'Escribiendo propuesta comercial...');
    await delay(900);
    update(3, 'running', 'Personalizando narrativas...');
    await delay(700);
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
      subtotalBeforeIVA: subtotal,
      iva,
      deliveryFee,
      total: roundCents(subtotal + iva),
      pricePerPerson: roundCents((subtotal + iva) / people),
    };
  }

  private buildBudgetPackage(
    id: Package['id'], displayName: string, tagline: string, narrative: string,
    highlights: string[], eventType: string, targetPricePerPerson: number,
    people: number, deliveryFee: number, durationBlock: string,
  ): Package {
    // Use the target price per person to select appropriate items
    const level = targetPricePerPerson <= 180 ? 'economico' : targetPricePerPerson <= 300 ? 'balanceado' : 'premium';
    const items = this.getItemsForLevel(eventType, level, people, durationBlock);
    const subtotal = items.reduce((s, i) => s + i.subtotal, 0) + deliveryFee;
    const iva = calculateIVA(subtotal);
    return {
      id, displayName, tagline, narrative, highlights, items,
      subtotalBeforeIVA: subtotal,
      iva,
      deliveryFee,
      total: roundCents(subtotal + iva),
      pricePerPerson: roundCents((subtotal + iva) / people),
    };
  }

  private getItemsForLevel(eventType: string, level: string, people: number, durationBlock: string): PackageItem[] {
    const items: PackageItem[] = [];

    // Rule 3: Duration < 2h → beverages only
    if (durationBlock === 'beverages_only') {
      // Minimum: 2 drinks per person (café + agua)
      items.push(makeItem('CA', 'Café de especialidad', 35, 1, people));
      items.push(makeItem('AG', 'Agua natural', 25, 1, people));
      if (level === 'balanceado' || level === 'premium') {
        items.push(makeItem('TE', 'Té selección', 30, 1, people));
      }
      if (level === 'premium') {
        items.push(makeItem('JU', 'Jugo natural', 45, 1, people));
      }
      return items;
    }

    // Rule 3: Duration 2-3h → beverages + snacks
    if (durationBlock === 'beverages_snacks') {
      items.push(makeItem('CA', 'Café de especialidad', 35, 1, people));
      items.push(makeItem('AG', 'Agua natural', 25, 1, people));
      if (level === 'economico') {
        items.push(makeItem('SN', 'Surtido de Snacks', 300, 1, Math.ceil(people / 7)));
      } else if (level === 'balanceado') {
        items.push(makeItem('SC', 'Surtido Colette', 450, 1, Math.ceil(people / 7)));
      } else {
        items.push(makeItem('SV', 'Surtido Voltaire (bocadillos gourmet)', 750, 1, Math.ceil(people / 7)));
      }
      return items;
    }

    // Rule 3: Duration > 3h → full food package
    // Original logic for full food, adapted by event type

    if (eventType === 'desayuno' || eventType === 'capacitacion') {
      if (level === 'economico') {
        items.push(makeItem('30', 'Desayuno Berlioz', 170, 1, people));
      } else if (level === 'balanceado') {
        items.push(makeItem('BR', 'Breakfast in Roma', 290, 1, people));
        items.push(makeItem('FI', 'Ensalada de fruta fresca', 50, 1, people));
      } else {
        items.push(makeItem('BM', 'Breakfast in Montreal (premium)', 410, 1, people));
        items.push(makeItem('FI', 'Ensalada de fruta fresca', 50, 1, people));
        items.push(makeItem('YO', 'Yogurt orgánico', 50, 1, people));
      }
    }

    if (eventType === 'coffee_break') {
      const sets = Math.ceil(people / 4);
      if (level === 'economico') {
        items.push(makeItem('CBA', 'Coffee Break AM (café)', 1440, 1, sets));
      } else if (level === 'balanceado') {
        items.push(makeItem('CBA', 'Coffee Break AM (café)', 1440, 1, sets));
        items.push(makeItem('SC', 'Surtido Colette', 450, 1, Math.ceil(people / 7)));
      } else {
        items.push(makeItem('CBA', 'Coffee Break AM (café)', 1440, 1, sets));
        items.push(makeItem('SV', 'Surtido Voltaire (bocadillos gourmet)', 750, 1, Math.ceil(people / 7)));
        items.push(makeItem('SZ', 'Surtido Zadig (postres)', 400, 1, Math.ceil(people / 7)));
      }
    }

    if (eventType === 'comida' || eventType === 'evento_especial') {
      if (level === 'economico') {
        items.push(makeItem('31', 'Comedor Berlioz', 170, 1, people));
      } else if (level === 'balanceado') {
        items.push(makeItem('31', 'Comedor Berlioz', 170, 1, people));
        items.push(makeItem('PQ', 'Panqué artesanal', 50, 1, people));
        items.push(makeItem('RF', 'Refresco/Agua', 50, 1, people));
      } else {
        items.push(makeItem('31', 'Comedor Berlioz', 170, 1, people));
        items.push(makeItem('SC', 'Surtido Camille (bocadillos gourmet)', 700, 1, Math.ceil(people / 7)));
        items.push(makeItem('PA', 'Paleta de hielo artesanal', 45, 1, people));
        items.push(makeItem('33', 'Servicio café/té/agua 24hrs', 250, 1, people));
      }
    }

    if (eventType === 'capacitacion') {
      if (level === 'economico') {
        items.push(makeItem('31', 'Comedor Berlioz', 170, 1, people));
        items.push(makeItem('33', 'Servicio café/té/agua', 250, 1, people));
      } else if (level === 'balanceado') {
        items.push(makeItem('31', 'Comedor Berlioz', 170, 1, people));
        items.push(makeItem('33', 'Servicio café/té/agua', 250, 1, people));
        items.push(makeItem('SN', 'Surtido de Snacks', 300, 1, Math.ceil(people / 7)));
      } else {
        items.push(makeItem('31', 'Comedor Berlioz', 170, 1, people));
        items.push(makeItem('33', 'Servicio café/té/agua', 250, 1, people));
        items.push(makeItem('SV', 'Surtido Voltaire', 750, 1, Math.ceil(people / 7)));
        items.push(makeItem('PA', 'Paleta de hielo artesanal', 45, 1, people));
      }
    }

    if (eventType === 'otro') {
      if (level === 'economico') {
        items.push(makeItem('31', 'Comedor Berlioz', 170, 1, people));
      } else if (level === 'balanceado') {
        items.push(makeItem('31', 'Comedor Berlioz', 170, 1, people));
        items.push(makeItem('33', 'Servicio café/té/agua', 250, 1, people));
      } else {
        items.push(makeItem('31', 'Comedor Berlioz', 170, 1, people));
        items.push(makeItem('33', 'Servicio café/té/agua', 250, 1, people));
        items.push(makeItem('SC', 'Surtido Camille (gourmet)', 700, 1, Math.ceil(people / 7)));
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
