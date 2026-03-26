// Complete Berlioz product catalog — real menu data
export interface CatalogProduct {
  name: string;
  price: number; // MXN per unit or per person
  category: string;
  occasion: string[];
  tags: string[];
  description?: string;
  sizes?: { label: string; price: number }[];
  unitsSold?: number;
  isBestseller?: boolean;
}

export const CATALOG: CatalogProduct[] = [
  // ═══ COFFEE BREAK ═══
  // Group packages
  { name: "Coffee Break AM – Café Caliente", price: 2800, category: "coffee-break", occasion: ["coffee-break"], tags: ["vegetarian-option"], description: "Bocadillos salados, mini pan dulce, frutas, yogurt, café caliente y snack", sizes: [{ label: "10 personas", price: 4650 }, { label: "15 personas", price: 4650 }] },
  { name: "Coffee Break AM – Café Frío", price: 1440, category: "coffee-break", occasion: ["coffee-break"], tags: ["vegetarian-option"], sizes: [{ label: "4 pers", price: 1440 }, { label: "6 pers", price: 2160 }, { label: "8 pers", price: 2880 }, { label: "10 pers", price: 3600 }, { label: "15 pers", price: 4500 }] },
  { name: "Coffee Break AM – Jugo", price: 1440, category: "coffee-break", occasion: ["coffee-break"], tags: ["vegetarian-option"], sizes: [{ label: "4 pers", price: 1440 }, { label: "6 pers", price: 2160 }, { label: "8 pers", price: 2880 }, { label: "10 pers", price: 3600 }, { label: "15 pers", price: 4500 }] },
  { name: "Coffee Break PM", price: 1240, category: "coffee-break", occasion: ["coffee-break"], tags: ["vegetarian-option"], sizes: [{ label: "4 pers", price: 1240 }, { label: "6 pers", price: 1860 }, { label: "8 pers", price: 2480 }, { label: "10 pers", price: 3100 }, { label: "15 pers", price: 3650 }] },

  // Large assortments
  { name: "Surtido Camille", price: 700, category: "coffee-break", occasion: ["coffee-break", "junta-ejecutiva"], tags: ["vegetarian-option"], description: "Gran surtido de bocadillos gourmet salados" },
  { name: "Surtido Hugo", price: 550, category: "coffee-break", occasion: ["coffee-break"], tags: ["vegetarian-option"], description: "16 piezas pan dulce recién horneado (6-8 personas)" },
  { name: "Surtido Voltaire", price: 750, category: "coffee-break", occasion: ["coffee-break", "junta-ejecutiva"], tags: ["vegetarian-option"], description: "Bocadillos artesanales salados, formato grande" },
  { name: "Surtido Colette", price: 450, category: "coffee-break", occasion: ["coffee-break"], tags: ["vegetarian-option"], description: "Mix de pan dulce y bocadillos finos" },
  { name: "Surtido Zadig", price: 400, category: "coffee-break", occasion: ["coffee-break"], tags: ["vegetarian-option"], description: "Repostería artesanal y mini pasteles" },
  { name: "Surtido Balzac", price: 400, category: "coffee-break", occasion: ["coffee-break"], tags: ["vegetarian-option"], description: "Mini postres y surtido de repostería" },
  { name: "Surtido de Snacks", price: 300, category: "coffee-break", occasion: ["coffee-break"], tags: ["healthy"], description: "Botanas saludables mixtas" },
  { name: "Surtido Dulces Mexicanos", price: 390, category: "coffee-break", occasion: ["coffee-break"], tags: [], description: "51 piezas: Pulparindos, Palanquetas, Mazapanes, Cocadas, Alegrías" },

  // Mini assortments
  { name: "Mini Surtido Hugo", price: 290, category: "coffee-break", occasion: ["coffee-break", "reunion-pequena"], tags: ["vegetarian-option"], description: "6 pcs mini pan dulce" },
  { name: "Mini Surtido Colette", price: 290, category: "coffee-break", occasion: ["coffee-break", "reunion-pequena"], tags: ["vegetarian-option"], description: "10 pcs mini pan dulce" },
  { name: "Mini Surtido Voltaire", price: 350, category: "coffee-break", occasion: ["coffee-break", "reunion-pequena"], tags: ["vegetarian-option"], description: "6 mini bocadillos salados gourmet" },
  { name: "Mini Surtido Camille", price: 350, category: "coffee-break", occasion: ["coffee-break", "reunion-pequena"], tags: ["vegetarian-option"], description: "6 mini bocadillos salados gourmet" },
  { name: "Mini Surtido Zadig", price: 240, category: "coffee-break", occasion: ["coffee-break", "reunion-pequena"], tags: ["vegetarian-option"], description: "8 mini postres finos" },
  { name: "Mini Surtido Balzac", price: 220, category: "coffee-break", occasion: ["coffee-break", "reunion-pequena"], tags: ["vegetarian-option"], description: "Mini surtido de postres" },

  // Individual sweet
  { name: "Panqué de Pera", price: 50, category: "coffee-break", occasion: ["coffee-break"], tags: ["vegetarian-option"], description: "Artesanal de pera y chocolate" },
  { name: "Panqué de Naranja", price: 50, category: "coffee-break", occasion: ["coffee-break"], tags: ["vegetarian-option"] },
  { name: "Cookies", price: 50, category: "coffee-break", occasion: ["coffee-break"], tags: ["vegetarian-option"], description: "Peanut butter cookies" },
  { name: "Pan Dulce (individual)", price: 50, category: "coffee-break", occasion: ["coffee-break"], tags: ["vegetarian-option"] },
  { name: "Paleta de Hielo", price: 45, category: "coffee-break", occasion: ["coffee-break"], tags: ["vegetarian-option"], description: "Paleta artesanal" },

  // Individual fresh/savory
  { name: "Mix de Semillas", price: 60, category: "coffee-break", occasion: ["coffee-break"], tags: ["healthy", "vegan"], description: "Natural/Romero/Enchiladas/Mix dulce-salado" },
  { name: "Ensalada de Fruta", price: 50, category: "coffee-break", occasion: ["coffee-break", "desayuno"], tags: ["vegan", "healthy"] },
  { name: "Ensalada de Pepino", price: 50, category: "coffee-break", occasion: ["coffee-break"], tags: ["vegetarian-option", "healthy"] },
  { name: "Ensalada de Jícama", price: 50, category: "coffee-break", occasion: ["coffee-break"], tags: ["vegan", "healthy"] },
  { name: "Yogurt Orgánico", price: 50, category: "coffee-break", occasion: ["coffee-break", "desayuno"], tags: ["vegetarian-option", "healthy"] },
  { name: "Crudités con Limón", price: 50, category: "coffee-break", occasion: ["coffee-break"], tags: ["vegan", "healthy"] },
  { name: "Snack Bag", price: 140, category: "coffee-break", occasion: ["coffee-break", "filmacion"], tags: ["portable"] },
  { name: "Snack (individual)", price: 50, category: "coffee-break", occasion: ["coffee-break"], tags: [] },

  // ═══ DESAYUNO ═══
  { name: "Desayuno Berlioz", price: 170, category: "desayuno", occasion: ["desayuno"], tags: ["economical"], description: "Chilaquiles o enchiladas + fruta + pan dulce", unitsSold: 4057, isBestseller: true },
  { name: "Healthy Breakfast", price: 335, category: "desayuno", occasion: ["desayuno"], tags: ["healthy", "vegetarian-option"] },
  { name: "Box Chilaquiles (verdes)", price: 310, category: "desayuno", occasion: ["desayuno"], tags: [] },
  { name: "Box Chilaquiles (con pollo)", price: 330, category: "desayuno", occasion: ["desayuno"], tags: [] },
  { name: "Breakfast in Roma", price: 290, category: "desayuno", occasion: ["desayuno"], tags: [], unitsSold: 2247 },
  { name: "Breakfast in Roma Vegetariano", price: 310, category: "desayuno", occasion: ["desayuno"], tags: ["vegetarian"] },
  { name: "Breakfast London", price: 320, category: "desayuno", occasion: ["desayuno"], tags: [] },
  { name: "Breakfast London Vegetariano", price: 340, category: "desayuno", occasion: ["desayuno"], tags: ["vegetarian"] },
  { name: "Breakfast in Montreal", price: 410, category: "desayuno", occasion: ["desayuno"], tags: [] },
  { name: "Breakfast BLT", price: 330, category: "desayuno", occasion: ["desayuno"], tags: [] },
  { name: "Breakfast Bag (pavo)", price: 250, category: "desayuno", occasion: ["desayuno", "filmacion"], tags: ["portable"], unitsSold: 3169 },
  { name: "Breakfast Bag (vegetariana)", price: 270, category: "desayuno", occasion: ["desayuno", "filmacion"], tags: ["vegetarian", "portable"] },
  { name: "Breakfast Bag (especial)", price: 280, category: "desayuno", occasion: ["desayuno", "filmacion"], tags: ["portable"] },

  // ═══ WORKING LUNCH ═══
  { name: "Salmon Box", price: 410, category: "working-lunch", occasion: ["working-lunch", "junta-ejecutiva"], tags: ["premium"] },
  { name: "Orzo Pasta Salad Box", price: 390, category: "working-lunch", occasion: ["working-lunch", "junta-ejecutiva"], tags: [], unitsSold: 3586 },
  { name: "Pink Box", price: 370, category: "working-lunch", occasion: ["working-lunch", "junta-ejecutiva"], tags: ["vegetarian-option", "vegan-option", "keto-option", "gluten-free-option"], unitsSold: 3728, isBestseller: true },
  { name: "Aqua Box", price: 330, category: "working-lunch", occasion: ["working-lunch"], tags: [] },
  { name: "Green Box", price: 340, category: "working-lunch", occasion: ["working-lunch"], tags: ["healthy"] },
  { name: "Golden Box", price: 330, category: "working-lunch", occasion: ["working-lunch", "junta-ejecutiva"], tags: ["healthy"], unitsSold: 3082 },
  { name: "Black Box", price: 330, category: "working-lunch", occasion: ["working-lunch"], tags: [], unitsSold: 2897 },
  { name: "BLT Box", price: 330, category: "working-lunch", occasion: ["working-lunch"], tags: [] },
  { name: "Box Oriental", price: 290, category: "working-lunch", occasion: ["working-lunch"], tags: ["vegetarian-option"], unitsSold: 2561 },
  { name: "White Box", price: 300, category: "working-lunch", occasion: ["working-lunch"], tags: [], unitsSold: 3284 },
  { name: "Salad Box Pollo", price: 280, category: "working-lunch", occasion: ["working-lunch"], tags: ["healthy", "gluten-free-option"], unitsSold: 2624 },
  { name: "Tex Mex Salad Box", price: 300, category: "working-lunch", occasion: ["working-lunch"], tags: [], unitsSold: 2373 },

  // Lunch bags
  { name: "Lunch Bag Ciabatta (pavo)", price: 250, category: "working-lunch", occasion: ["working-lunch", "filmacion"], tags: ["portable", "economical"], unitsSold: 2830 },
  { name: "Lunch Bag Ciabatta (vegetariana)", price: 270, category: "working-lunch", occasion: ["working-lunch", "filmacion"], tags: ["vegetarian", "portable"] },
  { name: "Lunch Bag Pasta (pollo)", price: 250, category: "working-lunch", occasion: ["working-lunch", "filmacion"], tags: ["economical"], unitsSold: 2267 },
  { name: "Lunch Bag Pasta (vegetariana)", price: 270, category: "working-lunch", occasion: ["working-lunch", "filmacion"], tags: ["vegetarian"] },

  // Economical
  { name: "Comedor Berlioz", price: 170, category: "working-lunch", occasion: ["working-lunch"], tags: ["economical", "budget"], unitsSold: 4057, isBestseller: true },
  { name: "Mini Box", price: 170, category: "working-lunch", occasion: ["working-lunch"], tags: ["economical"] },
  { name: "Box Económica 1 – Torta", price: 150, category: "working-lunch", occasion: ["working-lunch"], tags: ["economical", "budget"] },
  { name: "Box Económica 2", price: 170, category: "working-lunch", occasion: ["working-lunch"], tags: ["economical"] },
  { name: "Box Económica 3", price: 190, category: "working-lunch", occasion: ["working-lunch"], tags: ["economical"] },

  // ═══ VEGANO / VEGETARIANO ═══
  { name: "Orzo Pasta Salad Box Vegetariana", price: 390, category: "vegano-vegetariano", occasion: ["working-lunch"], tags: ["vegetarian"] },
  { name: "Pink Box Vegetariana", price: 370, category: "vegano-vegetariano", occasion: ["working-lunch"], tags: ["vegetarian"] },
  { name: "Pink Box Vegana", price: 370, category: "vegano-vegetariano", occasion: ["working-lunch"], tags: ["vegan"] },
  { name: "Pink Box Keto – Sin Gluten", price: 370, category: "vegano-vegetariano", occasion: ["working-lunch"], tags: ["keto", "gluten-free"] },
  { name: "Box Oriental Vegetariana", price: 290, category: "vegano-vegetariano", occasion: ["working-lunch"], tags: ["vegetarian"] },
  { name: "Salad Box Vegana", price: 300, category: "vegano-vegetariano", occasion: ["working-lunch"], tags: ["vegan", "healthy"] },
  { name: "Salad Box Vegetariana", price: 280, category: "vegano-vegetariano", occasion: ["working-lunch"], tags: ["vegetarian"] },
  { name: "Salad Box Pollo Gluten Free", price: 300, category: "vegano-vegetariano", occasion: ["working-lunch"], tags: ["gluten-free"] },

  // ═══ TORTAS PIROPO ═══
  { name: "Piropo – Tinga", price: 280, category: "tortas-piropo", occasion: ["working-lunch", "reunion-ejecutiva"], tags: [] },
  { name: "Piropo – Jamón y Queso", price: 280, category: "tortas-piropo", occasion: ["working-lunch", "reunion-ejecutiva"], tags: [] },
  { name: "Piropo – Carnitas", price: 280, category: "tortas-piropo", occasion: ["working-lunch", "reunion-ejecutiva"], tags: [] },
  { name: "Piropo – Cochinita", price: 280, category: "tortas-piropo", occasion: ["working-lunch", "reunion-ejecutiva"], tags: [] },
  { name: "Piropo – Camarón", price: 320, category: "tortas-piropo", occasion: ["working-lunch", "reunion-ejecutiva"], tags: [] },
  { name: "Piropo – Surtida (charola mediana)", price: 450, category: "tortas-piropo", occasion: ["working-lunch", "reunion-ejecutiva"], tags: [] },
  { name: "Piropo – Surtida (charola grande)", price: 550, category: "tortas-piropo", occasion: ["working-lunch", "reunion-ejecutiva"], tags: [] },

  // ═══ BEBIDAS ═══
  { name: "Café/Té Berlioz (servicio grupal)", price: 540, category: "bebidas", occasion: ["coffee-break", "desayuno", "working-lunch"], tags: [] },
  { name: "Café Frío", price: 60, category: "bebidas", occasion: ["coffee-break", "desayuno"], tags: [] },
  { name: "Jugo de Naranja", price: 60, category: "bebidas", occasion: ["desayuno"], tags: ["vegan"] },
  { name: "Agua Bui Natural", price: 50, category: "bebidas", occasion: ["working-lunch", "coffee-break", "desayuno"], tags: ["vegan"] },
  { name: "Agua Bui Mineral", price: 50, category: "bebidas", occasion: ["working-lunch", "coffee-break"], tags: ["vegan"] },
  { name: "Agua Bui Infusionada", price: 50, category: "bebidas", occasion: ["working-lunch", "coffee-break"], tags: ["vegan"] },
  { name: "San Pellegrino Melograno & Arancia", price: 50, category: "bebidas", occasion: ["working-lunch", "junta-ejecutiva"], tags: [] },
  { name: "San Pellegrino Aranciata Rossa", price: 50, category: "bebidas", occasion: ["working-lunch", "junta-ejecutiva"], tags: [] },
  { name: "Agua de Coco", price: 45, category: "bebidas", occasion: ["coffee-break"], tags: ["vegan"] },
  { name: "Agua de Jamaica", price: 45, category: "bebidas", occasion: ["working-lunch"], tags: ["vegan"] },
  { name: "Agua Fresca de Limón con Menta", price: 45, category: "bebidas", occasion: ["working-lunch", "coffee-break", "desayuno"], tags: ["vegan"], unitsSold: 3139, isBestseller: true },
  { name: "Agua de Temporada", price: 45, category: "bebidas", occasion: ["working-lunch"], tags: ["vegan"] },
  { name: "Coca Cola", price: 45, category: "bebidas", occasion: ["working-lunch"], tags: [] },
  { name: "Coca Cola Light", price: 45, category: "bebidas", occasion: ["working-lunch"], tags: [] },
  { name: "Refresco Lata (Sprite/Fanta)", price: 45, category: "bebidas", occasion: ["working-lunch"], tags: [] },
];

export const QUOTE_FOOTER_NOTES = [
  "El precio especial de las bags es a partir de 30 piezas iguales.",
  "Esta cotización es válida por 20 días naturales.",
  "Todos los pedidos deben estar pagados antes de la entrega.",
  "El pedido se realiza y paga directamente en nuestra página berlioz.mx",
  "Se recomienda solicitar la entrega con 90 minutos de anticipación.",
  "Servimos desayunos a partir de las 7:30 am y comidas a partir de las 10 am. En entregas antes de esos horarios se hace un cargo de $290.",
  "El costo del envío puede variar de acuerdo al código postal de la entrega.",
  "En compras de 80 piezas o más, aplica un cargo adicional.",
];

export const TOP_DELIVERY_ZONES = ["11520", "11000", "06600", "11560", "06500", "11510", "01210", "11700", "06700", "05348"];
export const BASE_SHIPPING_COST = 360;
