import type { MenuItem } from './MenuItem';

import foodBreakfast from '@/assets/food-breakfast.jpg';
import foodBoxlunch from '@/assets/food-boxlunch.jpg';
import foodSalad from '@/assets/food-salad.jpg';
import foodBerlioz from '@/assets/food-berlioz2.png';

export const MENU_CATALOG: MenuItem[] = [
  // Top sellers
  {
    id: 'surtido_camille',
    name: 'Surtido Camille',
    description: 'Bocadillos gourmet variados para compartir',
    pricePerPerson: 100,
    category: 'surtidos',
    image: foodBerlioz,
    isTopSeller: true,
  },
  {
    id: 'box_chilaquiles',
    name: 'Box Chilaquiles',
    description: 'Chilaquiles verdes o rojos con pollo',
    pricePerPerson: 170,
    category: 'desayuno',
    image: foodBreakfast,
    isTopSeller: true,
  },
  {
    id: 'coffee_break_am',
    name: 'Coffee Break AM',
    description: 'Café, galletas y fruta fresca',
    pricePerPerson: 360,
    category: 'coffee_break',
    image: foodSalad,
    isTopSeller: true,
  },
  {
    id: 'healthy_breakfast',
    name: 'Healthy Breakfast',
    description: 'Yogurt, granola, fruta y jugo natural',
    pricePerPerson: 290,
    category: 'desayuno',
    image: foodBreakfast,
    isTopSeller: true,
  },
  {
    id: 'torta_piropo',
    name: 'Torta Piropo',
    description: 'Torta gourmet con ingredientes artesanales',
    pricePerPerson: 170,
    category: 'tortas',
    image: foodBoxlunch,
    isTopSeller: true,
  },
  // More items
  {
    id: 'breakfast_roma',
    name: 'Breakfast in Roma',
    description: 'Desayuno completo estilo Roma',
    pricePerPerson: 290,
    category: 'desayuno',
    image: foodBreakfast,
  },
  {
    id: 'breakfast_montreal',
    name: 'Breakfast in Montreal',
    description: 'Desayuno premium internacional',
    pricePerPerson: 410,
    category: 'desayuno',
    image: foodBreakfast,
  },
  {
    id: 'comedor_berlioz',
    name: 'Comedor Berlioz',
    description: 'Comida completa del día con ensalada',
    pricePerPerson: 170,
    category: 'comida',
    image: foodBoxlunch,
  },
  {
    id: 'ensalada_pollo',
    name: 'Ensalada de Pollo',
    description: 'Ensalada fresca con pollo a la plancha',
    pricePerPerson: 165,
    category: 'comida',
    image: foodSalad,
  },
  {
    id: 'surtido_colette',
    name: 'Surtido Colette',
    description: 'Mini pastelería francesa surtida',
    pricePerPerson: 65,
    category: 'surtidos',
    image: foodBerlioz,
  },
  {
    id: 'surtido_voltaire',
    name: 'Surtido Voltaire',
    description: 'Bocadillos gourmet premium',
    pricePerPerson: 107,
    category: 'surtidos',
    image: foodBerlioz,
  },
  {
    id: 'torta_gourmet',
    name: 'Torta Gourmet',
    description: 'Selección de tortas artesanales',
    pricePerPerson: 170,
    category: 'tortas',
    image: foodBoxlunch,
  },
  {
    id: 'agua_fresca',
    name: 'Agua Fresca',
    description: 'Agua fresca del día (jarra)',
    pricePerPerson: 50,
    category: 'bebidas',
    image: foodSalad,
  },
  {
    id: 'cafe_servicio',
    name: 'Café y Té Continuo',
    description: 'Servicio de café y té ilimitado',
    pricePerPerson: 250,
    category: 'bebidas',
    image: foodBreakfast,
  },
];

export function getTopSellers(): MenuItem[] {
  return MENU_CATALOG.filter((item) => item.isTopSeller);
}

export function getByCategory(category: MenuItem['category']): MenuItem[] {
  return MENU_CATALOG.filter((item) => item.category === category);
}
