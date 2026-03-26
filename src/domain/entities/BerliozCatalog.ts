// Complete Berlioz product catalog — real menu data

export interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  category: 'desayuno' | 'coffee-break' | 'working-lunch' | 'vegano-vegetariano' | 'tortas-piropo' | 'bebidas' | 'surtidos-snacks';
  sidebarCategory: string; // for sidebar filter chips
  tags: string[];
  description?: string;
  isBestseller?: boolean;
  unitsSold?: number;
  isPerPerson?: boolean; // true = price is per person, qty scales with N
}

let _idCounter = 0;
function pid(): string { return `bp-${++_idCounter}`; }

export const CATALOG: CatalogProduct[] = [
  // ═══ DESAYUNO (from 7:30am) ═══
  { id: pid(), name: "Desayuno Berlioz", price: 170, category: "desayuno", sidebarCategory: "Desayuno", tags: ["economical"], description: "Chilaquiles o enchiladas + fruta + pan dulce", isBestseller: true, unitsSold: 4057, isPerPerson: true },
  { id: pid(), name: "Box Chilaquiles Verdes-Huevo", price: 310, category: "desayuno", sidebarCategory: "Desayuno", tags: [], isPerPerson: true },
  { id: pid(), name: "Box Chilaquiles Verdes-Pollo", price: 330, category: "desayuno", sidebarCategory: "Desayuno", tags: [], isPerPerson: true },
  { id: pid(), name: "Box Chilaquiles Rojos-Huevo", price: 310, category: "desayuno", sidebarCategory: "Desayuno", tags: [], isPerPerson: true },
  { id: pid(), name: "Box Chilaquiles Rojos-Pollo", price: 330, category: "desayuno", sidebarCategory: "Desayuno", tags: [], isPerPerson: true },
  { id: pid(), name: "Breakfast in Roma", price: 290, category: "desayuno", sidebarCategory: "Desayuno", tags: [], isBestseller: true, unitsSold: 2247, isPerPerson: true },
  { id: pid(), name: "Breakfast London", price: 320, category: "desayuno", sidebarCategory: "Desayuno", tags: [], isPerPerson: true },
  { id: pid(), name: "Breakfast in Montreal", price: 410, category: "desayuno", sidebarCategory: "Desayuno", tags: ["premium"], isPerPerson: true },
  { id: pid(), name: "Breakfast in Madrid", price: 300, category: "desayuno", sidebarCategory: "Desayuno", tags: [], isPerPerson: true },
  { id: pid(), name: "Healthy Breakfast", price: 335, category: "desayuno", sidebarCategory: "Desayuno", tags: ["healthy", "vegetarian-option"], isPerPerson: true },
  { id: pid(), name: "Breakfast BLT", price: 330, category: "desayuno", sidebarCategory: "Desayuno", tags: [], isPerPerson: true },
  { id: pid(), name: "Breakfast Bag (Pavo)", price: 250, category: "desayuno", sidebarCategory: "Desayuno", tags: ["portable"], isBestseller: true, unitsSold: 3169, isPerPerson: true },
  { id: pid(), name: "Breakfast Bag Especial", price: 280, category: "desayuno", sidebarCategory: "Desayuno", tags: ["portable"], isPerPerson: true },
  { id: pid(), name: "Breakfast in Roma Vegetariano", price: 310, category: "desayuno", sidebarCategory: "Desayuno", tags: ["vegetarian"], isPerPerson: true },
  { id: pid(), name: "Breakfast London Vegetariano", price: 340, category: "desayuno", sidebarCategory: "Desayuno", tags: ["vegetarian"], isPerPerson: true },

  // ═══ COFFEE BREAK ═══
  { id: pid(), name: "Coffee Break AM – Café Frío (4p)", price: 1440, category: "coffee-break", sidebarCategory: "Coffee Break", tags: ["vegetarian-option"] },
  { id: pid(), name: "Coffee Break AM – Jugo (4p)", price: 1440, category: "coffee-break", sidebarCategory: "Coffee Break", tags: ["vegetarian-option"] },
  { id: pid(), name: "Coffee Break AM – Café Caliente (10p)", price: 2800, category: "coffee-break", sidebarCategory: "Coffee Break", tags: ["vegetarian-option"] },
  { id: pid(), name: "Coffee Break PM (4p)", price: 1240, category: "coffee-break", sidebarCategory: "Coffee Break", tags: ["vegetarian-option"] },
  { id: pid(), name: "Surtido Hugo", price: 550, category: "coffee-break", sidebarCategory: "Surtidos", tags: ["vegetarian-option"], description: "16 piezas pan dulce recién horneado" },
  { id: pid(), name: "Surtido Camille", price: 700, category: "coffee-break", sidebarCategory: "Surtidos", tags: ["vegetarian-option"], description: "Gran surtido de bocadillos gourmet salados" },
  { id: pid(), name: "Surtido Voltaire", price: 750, category: "coffee-break", sidebarCategory: "Surtidos", tags: ["vegetarian-option"] },
  { id: pid(), name: "Surtido Colette", price: 450, category: "coffee-break", sidebarCategory: "Surtidos", tags: ["vegetarian-option"], description: "Mix de pan dulce y bocadillos finos" },
  { id: pid(), name: "Surtido Zadig", price: 400, category: "coffee-break", sidebarCategory: "Surtidos", tags: ["vegetarian-option"] },
  { id: pid(), name: "Surtido Balzac", price: 400, category: "coffee-break", sidebarCategory: "Surtidos", tags: ["vegetarian-option"] },
  { id: pid(), name: "Surtido Dulces Mexicanos", price: 390, category: "coffee-break", sidebarCategory: "Surtidos", tags: [], description: "51 piezas" },

  // ═══ WORKING LUNCH (from 10am) ═══
  { id: pid(), name: "Pink Box", price: 370, category: "working-lunch", sidebarCategory: "Working Lunch", tags: ["vegetarian-option", "vegan-option", "keto-option", "gluten-free-option"], isBestseller: true, unitsSold: 3728, isPerPerson: true },
  { id: pid(), name: "Orzo Pasta Salad Box", price: 390, category: "working-lunch", sidebarCategory: "Working Lunch", tags: [], isBestseller: true, unitsSold: 3586, isPerPerson: true },
  { id: pid(), name: "Golden Box", price: 330, category: "working-lunch", sidebarCategory: "Working Lunch", tags: ["healthy"], isBestseller: true, unitsSold: 3082, isPerPerson: true },
  { id: pid(), name: "Black Box", price: 330, category: "working-lunch", sidebarCategory: "Working Lunch", tags: [], isPerPerson: true },
  { id: pid(), name: "Green Box", price: 340, category: "working-lunch", sidebarCategory: "Working Lunch", tags: ["healthy"], isPerPerson: true },
  { id: pid(), name: "Aqua Box", price: 330, category: "working-lunch", sidebarCategory: "Working Lunch", tags: [], isPerPerson: true },
  { id: pid(), name: "White Box", price: 300, category: "working-lunch", sidebarCategory: "Working Lunch", tags: [], isBestseller: true, unitsSold: 3284, isPerPerson: true },
  { id: pid(), name: "Box Oriental", price: 290, category: "working-lunch", sidebarCategory: "Working Lunch", tags: ["vegetarian-option"], isBestseller: true, unitsSold: 2561, isPerPerson: true },
  { id: pid(), name: "Salad Box Pollo", price: 300, category: "working-lunch", sidebarCategory: "Working Lunch", tags: ["healthy"], isPerPerson: true },
  { id: pid(), name: "BLT Box", price: 330, category: "working-lunch", sidebarCategory: "Working Lunch", tags: [], isPerPerson: true },
  { id: pid(), name: "Lunch Bag Ciabatta (Pavo)", price: 250, category: "working-lunch", sidebarCategory: "Working Lunch", tags: ["portable", "economical"], isBestseller: true, unitsSold: 2830, isPerPerson: true },
  { id: pid(), name: "Lunch Bag Pasta (Pollo)", price: 250, category: "working-lunch", sidebarCategory: "Working Lunch", tags: ["economical"], isBestseller: true, unitsSold: 2267, isPerPerson: true },
  { id: pid(), name: "Comedor Berlioz", price: 170, category: "working-lunch", sidebarCategory: "Working Lunch", tags: ["economical", "budget"], isBestseller: true, unitsSold: 4057, isPerPerson: true },
  { id: pid(), name: "Mini Box", price: 170, category: "working-lunch", sidebarCategory: "Working Lunch", tags: ["economical"], isPerPerson: true },
  { id: pid(), name: "Box Económica 1", price: 150, category: "working-lunch", sidebarCategory: "Working Lunch", tags: ["economical", "budget"], isPerPerson: true },
  { id: pid(), name: "Box Económica 2", price: 170, category: "working-lunch", sidebarCategory: "Working Lunch", tags: ["economical"], isPerPerson: true },
  { id: pid(), name: "Box Económica 3", price: 190, category: "working-lunch", sidebarCategory: "Working Lunch", tags: ["economical"], isPerPerson: true },

  // ═══ VEGANO / VEGETARIANO ═══
  { id: pid(), name: "Pink Box Vegetariana", price: 370, category: "vegano-vegetariano", sidebarCategory: "Working Lunch", tags: ["vegetarian"], isPerPerson: true },
  { id: pid(), name: "Pink Box Vegana", price: 370, category: "vegano-vegetariano", sidebarCategory: "Working Lunch", tags: ["vegan"], isPerPerson: true },
  { id: pid(), name: "Pink Box Keto GF", price: 370, category: "vegano-vegetariano", sidebarCategory: "Working Lunch", tags: ["keto", "gluten-free"], isPerPerson: true },
  { id: pid(), name: "Orzo Pasta Vegetariana", price: 390, category: "vegano-vegetariano", sidebarCategory: "Working Lunch", tags: ["vegetarian"], isPerPerson: true },
  { id: pid(), name: "Box Oriental Vegetariana", price: 290, category: "vegano-vegetariano", sidebarCategory: "Working Lunch", tags: ["vegetarian"], isPerPerson: true },
  { id: pid(), name: "Salad Box Vegana", price: 320, category: "vegano-vegetariano", sidebarCategory: "Working Lunch", tags: ["vegan", "healthy"], isPerPerson: true },
  { id: pid(), name: "Salad Box Vegetariana", price: 300, category: "vegano-vegetariano", sidebarCategory: "Working Lunch", tags: ["vegetarian"], isPerPerson: true },
  { id: pid(), name: "Salad Box Pollo GF", price: 320, category: "vegano-vegetariano", sidebarCategory: "Working Lunch", tags: ["gluten-free"], isPerPerson: true },
  { id: pid(), name: "Lunch Bag Pasta Vegetariana", price: 270, category: "vegano-vegetariano", sidebarCategory: "Working Lunch", tags: ["vegetarian"], isPerPerson: true },

  // ═══ TORTAS PIROPO ═══
  { id: pid(), name: "Piropo – Tinga", price: 280, category: "tortas-piropo", sidebarCategory: "Piropo", tags: [], isPerPerson: true },
  { id: pid(), name: "Piropo – Jamón y Queso", price: 280, category: "tortas-piropo", sidebarCategory: "Piropo", tags: [], isPerPerson: true },
  { id: pid(), name: "Piropo – Carnitas", price: 280, category: "tortas-piropo", sidebarCategory: "Piropo", tags: [], isPerPerson: true },
  { id: pid(), name: "Piropo – Cochinita", price: 280, category: "tortas-piropo", sidebarCategory: "Piropo", tags: [], isPerPerson: true },
  { id: pid(), name: "Piropo – Camarón", price: 320, category: "tortas-piropo", sidebarCategory: "Piropo", tags: [], isPerPerson: true },
  { id: pid(), name: "Piropo – Surtida (charola)", price: 500, category: "tortas-piropo", sidebarCategory: "Piropo", tags: [] },

  // ═══ BEBIDAS ═══
  { id: pid(), name: "Café/Té Berlioz", price: 540, category: "bebidas", sidebarCategory: "Bebidas", tags: [], description: "Caja 12 tazas" },
  { id: pid(), name: "Agua Fresca Limón con Menta", price: 45, category: "bebidas", sidebarCategory: "Bebidas", tags: ["vegan"], isBestseller: true, unitsSold: 3139, isPerPerson: true },
  { id: pid(), name: "Agua de Jamaica", price: 45, category: "bebidas", sidebarCategory: "Bebidas", tags: ["vegan"], isPerPerson: true },
  { id: pid(), name: "Agua de Coco", price: 45, category: "bebidas", sidebarCategory: "Bebidas", tags: ["vegan"], isPerPerson: true },
  { id: pid(), name: "Agua de Temporada", price: 45, category: "bebidas", sidebarCategory: "Bebidas", tags: ["vegan"], isPerPerson: true },
  { id: pid(), name: "Jugo de Naranja", price: 60, category: "bebidas", sidebarCategory: "Bebidas", tags: ["vegan"], isPerPerson: true },
  { id: pid(), name: "Café Frío", price: 60, category: "bebidas", sidebarCategory: "Bebidas", tags: [], isPerPerson: true },
  { id: pid(), name: "Agua Bui Natural", price: 50, category: "bebidas", sidebarCategory: "Bebidas", tags: [], isPerPerson: true },
  { id: pid(), name: "Agua Bui Mineral", price: 50, category: "bebidas", sidebarCategory: "Bebidas", tags: [], isPerPerson: true },
  { id: pid(), name: "San Pellegrino", price: 50, category: "bebidas", sidebarCategory: "Bebidas", tags: [], isPerPerson: true },
  { id: pid(), name: "Coca Cola", price: 45, category: "bebidas", sidebarCategory: "Bebidas", tags: [], isPerPerson: true },
  { id: pid(), name: "Coca Cola Light", price: 45, category: "bebidas", sidebarCategory: "Bebidas", tags: [], isPerPerson: true },

  // ═══ SURTIDOS / SNACKS ═══
  { id: pid(), name: "Surtido de Snacks", price: 300, category: "coffee-break", sidebarCategory: "Snacks", tags: ["healthy"], description: "Botana sana para compartir (6-8 personas)" },
  { id: pid(), name: "Mini Surtido Hugo", price: 290, category: "coffee-break", sidebarCategory: "Surtidos", tags: ["vegetarian-option"] },
  { id: pid(), name: "Mini Surtido Colette", price: 290, category: "coffee-break", sidebarCategory: "Surtidos", tags: ["vegetarian-option"] },
  { id: pid(), name: "Mini Surtido Voltaire", price: 350, category: "coffee-break", sidebarCategory: "Surtidos", tags: ["vegetarian-option"] },
  { id: pid(), name: "Mini Surtido Camille", price: 350, category: "coffee-break", sidebarCategory: "Surtidos", tags: ["vegetarian-option"] },
  { id: pid(), name: "Mini Surtido Zadig", price: 240, category: "coffee-break", sidebarCategory: "Surtidos", tags: ["vegetarian-option"] },
  { id: pid(), name: "Snack Bag", price: 170, category: "coffee-break", sidebarCategory: "Snacks", tags: ["portable"], isPerPerson: true },
  { id: pid(), name: "Mix de Semillas", price: 60, category: "coffee-break", sidebarCategory: "Snacks", tags: ["healthy", "vegan"], isPerPerson: true },
  { id: pid(), name: "Ensalada de Fruta", price: 50, category: "coffee-break", sidebarCategory: "Snacks", tags: ["vegan", "healthy"], isPerPerson: true },
  { id: pid(), name: "Yogurt Orgánico", price: 50, category: "coffee-break", sidebarCategory: "Snacks", tags: ["vegetarian-option", "healthy"], isPerPerson: true },
  { id: pid(), name: "Crudités con Limón", price: 50, category: "coffee-break", sidebarCategory: "Snacks", tags: ["vegan", "healthy"], isPerPerson: true },
  { id: pid(), name: "Panqué de Pera", price: 50, category: "coffee-break", sidebarCategory: "Snacks", tags: ["vegetarian-option"], isPerPerson: true },
  { id: pid(), name: "Cookies", price: 50, category: "coffee-break", sidebarCategory: "Snacks", tags: ["vegetarian-option"], isPerPerson: true },
];

export function findProduct(name: string): CatalogProduct | undefined {
  return CATALOG.find(p => p.name === name);
}

export const SIDEBAR_CATEGORIES = ["Desayuno", "Coffee Break", "Working Lunch", "Surtidos", "Bebidas", "Snacks", "Piropo"];

// ═══ DEFAULT ITEMS PER PACKAGE & EVENT TYPE ═══
export interface DefaultItem {
  productName: string;
  qtyMultiplier: 'N' | number; // 'N' = multiply by people count, number = fixed qty
}

export type PackageTier = 'esencial' | 'equilibrado' | 'experiencia';

const DESAYUNO_DEFAULTS: Record<PackageTier, DefaultItem[]> = {
  esencial: [
    { productName: "Desayuno Berlioz", qtyMultiplier: 'N' },
    { productName: "Surtido de Snacks", qtyMultiplier: 1 },
  ],
  equilibrado: [
    { productName: "Breakfast in Roma", qtyMultiplier: 'N' },
    { productName: "Surtido Colette", qtyMultiplier: 1 },
    { productName: "Agua de Jamaica", qtyMultiplier: 'N' },
    { productName: "Café/Té Berlioz", qtyMultiplier: 1 },
  ],
  experiencia: [
    { productName: "Breakfast in Montreal", qtyMultiplier: 'N' },
    { productName: "Café/Té Berlioz", qtyMultiplier: 1 },
    { productName: "Surtido Hugo", qtyMultiplier: 1 },
    { productName: "Agua Fresca Limón con Menta", qtyMultiplier: 'N' },
  ],
};

const WORKING_LUNCH_DEFAULTS: Record<PackageTier, DefaultItem[]> = {
  esencial: [
    { productName: "Comedor Berlioz", qtyMultiplier: 'N' },
    { productName: "Surtido de Snacks", qtyMultiplier: 1 },
  ],
  equilibrado: [
    { productName: "Golden Box", qtyMultiplier: 'N' },
    { productName: "Surtido Colette", qtyMultiplier: 1 },
    { productName: "Agua de Jamaica", qtyMultiplier: 'N' },
    { productName: "Café/Té Berlioz", qtyMultiplier: 1 },
  ],
  experiencia: [
    { productName: "Pink Box", qtyMultiplier: 'N' },
    { productName: "Café/Té Berlioz", qtyMultiplier: 1 },
    { productName: "Surtido Hugo", qtyMultiplier: 1 },
    { productName: "Agua Fresca Limón con Menta", qtyMultiplier: 'N' },
  ],
};

const COFFEE_BREAK_DEFAULTS: Record<PackageTier, DefaultItem[]> = {
  esencial: [
    { productName: "Coffee Break PM (4p)", qtyMultiplier: 1 },
    { productName: "Surtido de Snacks", qtyMultiplier: 1 },
  ],
  equilibrado: [
    { productName: "Coffee Break AM – Café Caliente (10p)", qtyMultiplier: 1 },
    { productName: "Surtido Colette", qtyMultiplier: 1 },
    { productName: "Agua Fresca Limón con Menta", qtyMultiplier: 'N' },
  ],
  experiencia: [
    { productName: "Coffee Break AM – Café Caliente (10p)", qtyMultiplier: 1 },
    { productName: "Surtido Camille", qtyMultiplier: 1 },
    { productName: "Surtido Hugo", qtyMultiplier: 1 },
    { productName: "Agua Fresca Limón con Menta", qtyMultiplier: 'N' },
  ],
};

const CAPACITACION_DEFAULTS: Record<PackageTier, DefaultItem[]> = {
  esencial: [
    { productName: "Desayuno Berlioz", qtyMultiplier: 'N' },
    { productName: "Comedor Berlioz", qtyMultiplier: 'N' },
    { productName: "Coffee Break PM (4p)", qtyMultiplier: 1 },
  ],
  equilibrado: [
    { productName: "Breakfast in Roma", qtyMultiplier: 'N' },
    { productName: "Golden Box", qtyMultiplier: 'N' },
    { productName: "Coffee Break AM – Café Caliente (10p)", qtyMultiplier: 1 },
    { productName: "Café/Té Berlioz", qtyMultiplier: 1 },
    { productName: "Agua de Jamaica", qtyMultiplier: 'N' },
  ],
  experiencia: [
    { productName: "Breakfast in Montreal", qtyMultiplier: 'N' },
    { productName: "Pink Box", qtyMultiplier: 'N' },
    { productName: "Coffee Break AM – Café Caliente (10p)", qtyMultiplier: 1 },
    { productName: "Surtido Hugo", qtyMultiplier: 1 },
    { productName: "Café/Té Berlioz", qtyMultiplier: 1 },
    { productName: "Agua Fresca Limón con Menta", qtyMultiplier: 'N' },
  ],
};

const REUNION_DEFAULTS: Record<PackageTier, DefaultItem[]> = {
  esencial: [
    { productName: "Mini Box", qtyMultiplier: 'N' },
    { productName: "Surtido de Snacks", qtyMultiplier: 1 },
  ],
  equilibrado: [
    { productName: "Golden Box", qtyMultiplier: 'N' },
    { productName: "Mini Surtido Camille", qtyMultiplier: 1 },
    { productName: "Café/Té Berlioz", qtyMultiplier: 1 },
    { productName: "Agua Fresca Limón con Menta", qtyMultiplier: 'N' },
  ],
  experiencia: [
    { productName: "Orzo Pasta Salad Box", qtyMultiplier: 'N' },
    { productName: "Surtido Camille", qtyMultiplier: 1 },
    { productName: "Café/Té Berlioz", qtyMultiplier: 1 },
    { productName: "Surtido Hugo", qtyMultiplier: 1 },
    { productName: "Agua Fresca Limón con Menta", qtyMultiplier: 'N' },
  ],
};

const FILMACION_DEFAULTS: Record<PackageTier, DefaultItem[]> = {
  esencial: [
    { productName: "Lunch Bag Ciabatta (Pavo)", qtyMultiplier: 'N' },
    { productName: "Surtido de Snacks", qtyMultiplier: 1 },
  ],
  equilibrado: [
    { productName: "Lunch Bag Pasta (Pollo)", qtyMultiplier: 'N' },
    { productName: "Surtido Colette", qtyMultiplier: 1 },
    { productName: "Agua de Jamaica", qtyMultiplier: 'N' },
    { productName: "Café/Té Berlioz", qtyMultiplier: 1 },
  ],
  experiencia: [
    { productName: "Breakfast Bag (Pavo)", qtyMultiplier: 'N' },
    { productName: "Golden Box", qtyMultiplier: 'N' },
    { productName: "Café/Té Berlioz", qtyMultiplier: 1 },
    { productName: "Agua Fresca Limón con Menta", qtyMultiplier: 'N' },
  ],
};

export function getDefaultItems(eventType: string): Record<PackageTier, DefaultItem[]> {
  switch (eventType) {
    case 'desayuno': return DESAYUNO_DEFAULTS;
    case 'working-lunch': return WORKING_LUNCH_DEFAULTS;
    case 'coffee-break': return COFFEE_BREAK_DEFAULTS;
    case 'capacitacion': return CAPACITACION_DEFAULTS;
    case 'reunion-ejecutiva': return REUNION_DEFAULTS;
    case 'filmacion': return FILMACION_DEFAULTS;
    default: return DESAYUNO_DEFAULTS;
  }
}

// ═══ ADD-ONS ═══
export interface QuoteAddon {
  id: string;
  name: string;
  description: string;
  price: number;
  priceUnit: string;
  icon: string;
}

export const QUOTE_ADDONS: QuoteAddon[] = [
  { id: "cafe-te", name: "Café/Té Berlioz", description: "Caja con café o agua para té (12 tazas). Precio fijo por unidad.", price: 540, priceUnit: "/caja", icon: "☕" },
  { id: "snack-bag", name: "Snack Bag Individual", description: "Bolsita individual de break", price: 140, priceUnit: "/pza", icon: "🍿" },
  { id: "surtido-snacks", name: "Surtido de Snacks", description: "Botana sana para compartir (6-8 personas)", price: 300, priceUnit: "/surtido", icon: "🥜" },
  { id: "logo-tapa", name: "Mi logo en la tapa", description: "Personaliza tus cajas con tu marca (mín. 50 pzas)", price: 10, priceUnit: "/pza", icon: "🏷️" },
  { id: "sticker", name: "Sticker personalizado", description: "Te pasamos las medidas de la tapa", price: 10, priceUnit: "/pza", icon: "✨" },
  { id: "aguas-frescas", name: "Aguas frescas", description: "Jamaica, limón con menta, coco, temporada", price: 45, priceUnit: "/pza", icon: "🥤" },
  { id: "personal-servicio", name: "Personal de servicio", description: "Meseros y/o personal de limpieza para tu evento", price: 500, priceUnit: "/persona", icon: "🤵" },
];

// ═══ BUSINESS CONSTANTS ═══
export const TOP_DELIVERY_ZONES = [
  "11520", "11000", "06600", "11560", "06500", "11510", "01210", "11700", "06700", "05348",
  "06760", "11590", "11800", "01000",
];

export const BASE_SHIPPING_COST = 360;
export const EARLY_DELIVERY_SURCHARGE = 290;
export const IVA_RATE = 0.16;
export const QUOTE_VALIDITY_DAYS = 20;

export const QUOTE_FOOTER_NOTES = [
  "Cotización válida por 20 días naturales.",
  "Precio especial de bags a partir de 30 piezas iguales.",
  "Todos los pedidos deben pagarse antes de la entrega.",
  "El pedido se realiza y paga directamente en berlioz.mx",
  "Se recomienda solicitar la entrega con 90 minutos de anticipación.",
  "Desayunos desde 7:30am y comidas desde 10am — entregas antes de estos horarios tienen cargo de $290.",
  "El costo del envío puede variar según código postal de entrega.",
  "En compras de 80 piezas o más aplica cargo adicional por logística.",
  "Berlioz entrega desde 4 personas.",
  "Comedor Berlioz: mínimo 10 piezas iguales.",
  "Box Económica (1, 2, 3): mínimo 20 piezas iguales.",
  "Mini Box ($170): sin mínimo.",
  "Pedido promedio: 8-15 personas. Default sugerido: 10 personas.",
  "Personal de apoyo: distribución de alimentos. No incluye servicio de meseros formales.",
];

// ═══ DURATION OPTIONS ═══
export interface DurationOption {
  id: string;
  label: string;
  subtitle: string;
  priceHint: string;
}

export const DURATION_OPTIONS: DurationOption[] = [
  { id: "1h", label: "1 hora", subtitle: "Solo bebidas — café + agua", priceHint: "Desde $95/persona" },
  { id: "2-3h", label: "2-3 horas", subtitle: "Coffee Break — bebidas y snacks", priceHint: "Desde $240/persona" },
  { id: "3-5h", label: "3-5 horas — Working Lunch", subtitle: "Comida principal + bebidas", priceHint: "Desde $280/persona" },
  { id: "5h+", label: "Día completo (5h+)", subtitle: "Desayuno + comida + coffee break", priceHint: "Desde $580/persona" },
];

// ═══ QUOTE ID GENERATOR ═══
export function generateQuoteId(): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let rand = '';
  for (let i = 0; i < 4; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `BZ-${dateStr}-${rand}`;
}
