import type { IntakeForm, AgentState, Proposal, Package, PackageItem } from "@/types";
import { BUSINESS_RULES } from "@/types";

const EVENT_LABELS: Record<string, string> = {
  desayuno: 'Desayuno corporativo',
  coffee_break: 'Coffee break',
  comida: 'Comida de trabajo',
  capacitacion: 'Capacitación (día completo)',
  evento_especial: 'Evento especial',
  otro: 'Otro',
};

const LEVEL_MAP: Record<string, string> = {
  economico: 'basic',
  balanceado: 'standard',
  premium: 'premium',
};

// Deterministic proposal generation (no AI needed for MVP)
export function generateProposalSync(form: IntakeForm): Proposal {
  const numPeople = form.personas;
  const deliveries = form.esMultiDia
    ? Math.max(1, form.entregasPorDia.length) * getDayCount(form)
    : form.horasEntrega.length || 1;
  const deliveryFee = 360 * deliveries;
  const eventLabel = EVENT_LABELS[form.eventType] || 'Evento';

  const packages: Package[] = [
    buildBasicoPackage(form, numPeople, deliveryFee),
    buildRecomendadoPackage(form, numPeople, deliveryFee),
    buildPremiumPackage(form, numPeople, deliveryFee),
  ];

  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setDate(validUntil.getDate() + 20);

  return {
    proposalId: `BZ-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    createdAt: now.toISOString(),
    intro: `Estimado/a ${form.contacto.atencion}, en Berlioz nos da mucho gusto preparar esta propuesta de ${eventLabel.toLowerCase()} para ${form.contacto.empresa}. Nuestro compromiso es ofrecer una experiencia gastronómica memorable con ingredientes frescos y un servicio impecable.`,
    packages,
    recommendedId: 'recomendado',
    recommendedReason: 'Ofrece el mejor equilibrio entre calidad, variedad y precio — es la opción que más eligen nuestros clientes corporativos.',
    validUntil: validUntil.toISOString().split('T')[0],
    businessRules: BUSINESS_RULES,
  };
}

function getDayCount(form: IntakeForm): number {
  if (!form.fechaInicio || !form.fechaFin) return 1;
  const start = new Date(form.fechaInicio);
  const end = new Date(form.fechaFin);
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

function buildBasicoPackage(form: IntakeForm, people: number, deliveryFee: number): Package {
  const items = getItemsForLevel(form.eventType, 'economico', people);
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0) + deliveryFee;
  const iva = Math.round(subtotal * 0.16 * 100) / 100;
  return {
    id: 'basico',
    displayName: 'Esencial',
    tagline: 'Lo necesario, bien ejecutado',
    narrative: `Un servicio funcional y confiable para ${people} personas. Incluye los elementos clave para que tu equipo esté bien atendido sin complicaciones.`,
    highlights: ['Entrega puntual garantizada', 'Menú clásico y confiable', 'Ideal para eventos recurrentes'],
    items,
    subtotalBeforeIVA: subtotal,
    iva,
    deliveryFee,
    total: Math.round((subtotal + iva) * 100) / 100,
    pricePerPerson: Math.round((subtotal + iva) / people * 100) / 100,
  };
}

function buildRecomendadoPackage(form: IntakeForm, people: number, deliveryFee: number): Package {
  const items = getItemsForLevel(form.eventType, 'balanceado', people);
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0) + deliveryFee;
  const iva = Math.round(subtotal * 0.16 * 100) / 100;
  return {
    id: 'recomendado',
    displayName: 'Equilibrado',
    tagline: 'La experiencia que tu equipo merece',
    narrative: `Nuestro paquete más popular combina sabor, presentación y valor. Tu equipo disfrutará de una selección variada y cuidadosamente preparada que eleva cualquier jornada de trabajo.`,
    highlights: ['Variedad de opciones por persona', 'Incluye bebidas y snacks', 'Presentación profesional premium'],
    items,
    subtotalBeforeIVA: subtotal,
    iva,
    deliveryFee,
    total: Math.round((subtotal + iva) * 100) / 100,
    pricePerPerson: Math.round((subtotal + iva) / people * 100) / 100,
  };
}

function buildPremiumPackage(form: IntakeForm, people: number, deliveryFee: number): Package {
  const items = getItemsForLevel(form.eventType, 'premium', people);
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0) + deliveryFee;
  const iva = Math.round(subtotal * 0.16 * 100) / 100;
  return {
    id: 'premium',
    displayName: 'Experiencia Completa',
    tagline: 'Cada detalle cuenta',
    narrative: `Una experiencia gastronómica integral con los mejores ingredientes, opciones gourmet y servicio de bebidas premium. Ideal para cuando quieres impresionar y consentir a tu equipo.`,
    highlights: ['Opciones gourmet y artesanales', 'Servicio completo de bebidas', 'Postres y snacks premium incluidos'],
    items,
    subtotalBeforeIVA: subtotal,
    iva,
    deliveryFee,
    total: Math.round((subtotal + iva) * 100) / 100,
    pricePerPerson: Math.round((subtotal + iva) / people * 100) / 100,
  };
}

function getItemsForLevel(eventType: string, level: string, people: number): PackageItem[] {
  const items: PackageItem[] = [];

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
    if (level === 'economico') {
      const sets = Math.ceil(people / 4);
      items.push(makeItem('CBA', 'Coffee Break AM (café)', 1440, 1, sets));
    } else if (level === 'balanceado') {
      const sets = Math.ceil(people / 4);
      items.push(makeItem('CBA', 'Coffee Break AM (café)', 1440, 1, sets));
      items.push(makeItem('SC', 'Surtido Colette', 450, 1, Math.ceil(people / 7)));
    } else {
      const sets = Math.ceil(people / 4);
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
    // Add lunch component
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

function makeItem(code: string, name: string, unitPrice: number, qtyPerPerson: number, totalQty: number): PackageItem {
  return {
    code,
    name,
    unitPrice,
    qtyPerPerson,
    totalQty,
    subtotal: unitPrice * totalQty,
  };
}

// Simulate agent pipeline with delays
export async function runAgentPipeline(
  form: IntakeForm,
  onAgentUpdate: (agents: AgentState[]) => void
): Promise<Proposal> {
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

  // Agent 1 - Discovery
  update(0, 'running', 'Analizando tipo de evento...');
  await delay(800);
  update(0, 'running', `Evento: ${EVENT_LABELS[form.eventType] || form.eventType}`);
  await delay(600);
  update(0, 'running', `${form.personas} personas detectadas`);
  await delay(500);
  update(0, 'done', 'Análisis completado ✓');

  // Agent 2 - Menu
  update(1, 'running', 'Consultando catálogo Berlioz...');
  await delay(700);
  update(1, 'running', `Nivel: ${form.nivelEsperado}`);
  await delay(800);
  update(1, 'running', 'Seleccionando 3 paquetes...');
  await delay(600);
  update(1, 'done', 'Menús seleccionados ✓');

  // Agent 3 - Pricing
  update(2, 'running', 'Calculando precios unitarios...');
  await delay(600);
  update(2, 'running', 'Aplicando reglas de negocio...');
  await delay(700);
  update(2, 'running', 'Sumando IVA y envío...');
  await delay(500);
  update(2, 'done', 'Precios calculados ✓');

  // Agent 4 - Writer
  update(3, 'running', 'Escribiendo propuesta comercial...');
  await delay(900);
  update(3, 'running', 'Personalizando narrativas...');
  await delay(700);
  update(3, 'done', 'Propuesta lista ✓');

  return generateProposalSync(form);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
