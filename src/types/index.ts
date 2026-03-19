export interface IntakeForm {
  // Lead capture (Step 1)
  nombre: string;
  empresa: string;
  celular: string;
  eventType: 'desayuno' | 'coffee_break' | 'comida' | 'capacitacion' | 'evento_especial' | 'otro' | '';
  personas: number;
  fechaInicio: string;
  fechaFin?: string;
  esMultiDia: boolean;
  entregasPorDia: ('manana' | 'mediodia' | 'noche')[];
  horasEntrega: string[];
  horasEvento: number;
  nivelEsperado: 'economico' | 'balanceado' | 'premium' | '';
  notasDieteticas?: string;
  contacto: {
    nombre: string;
    empresa: string;
    email: string;
    telefono?: string;
    atencion: string;
  };
}

export interface PackageItem {
  code: string;
  name: string;
  unitPrice: number;
  qtyPerPerson: number;
  totalQty: number;
  subtotal: number;
}

export interface Package {
  id: 'basico' | 'recomendado' | 'premium';
  displayName: string;
  tagline: string;
  narrative: string;
  highlights: string[];
  items: PackageItem[];
  subtotalBeforeIVA: number;
  iva: number;
  deliveryFee: number;
  total: number;
  pricePerPerson: number;
}

export interface Proposal {
  proposalId: string;
  createdAt: string;
  intro: string;
  packages: Package[];
  recommendedId: 'recomendado';
  recommendedReason: string;
  validUntil: string;
  businessRules: string[];
}

export interface AgentState {
  id: string;
  name: string;
  icon: string;
  status: 'idle' | 'running' | 'done' | 'error';
  logs: string[];
}

export const BUSINESS_RULES = [
  'Cotización válida por 20 días naturales',
  'Precio especial de bags a partir de 30 piezas iguales',
  'Todos los pedidos deben pagarse antes de la entrega',
  'El pedido se realiza y paga en berlioz.mx',
  'Se recomienda solicitar entrega con 90 minutos de anticipación',
  'Desayunos desde 7:30am y comidas desde 10am — entregas antes de estos horarios tienen cargo de $290',
  'El costo de envío puede variar según código postal de entrega',
  'En compras de 80 piezas o más aplica cargo adicional por logística',
];

export const DEFAULT_INTAKE: IntakeForm = {
  nombre: '',
  empresa: '',
  celular: '',
  eventType: '',
  personas: 30,
  fechaInicio: '',
  fechaFin: '',
  esMultiDia: false,
  entregasPorDia: [],
  horasEntrega: [],
  horasEvento: 4,
  nivelEsperado: '',
  notasDieteticas: '',
  contacto: {
    nombre: '',
    empresa: '',
    email: '',
    telefono: '',
    atencion: '',
  },
};
