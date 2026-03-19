export interface MenuItem {
  id: string;
  name: string;
  description: string;
  pricePerPerson: number;
  category: MenuCategory;
  image?: string;
  isTopSeller?: boolean;
}

export type MenuCategory =
  | 'coffee_break'
  | 'desayuno'
  | 'comida'
  | 'tortas'
  | 'surtidos'
  | 'bebidas';

export const MENU_CATEGORY_LABELS: Record<MenuCategory, string> = {
  coffee_break: 'Coffee Break',
  desayuno: 'Desayuno',
  comida: 'Comida',
  tortas: 'Tortas Gourmet',
  surtidos: 'Surtidos',
  bebidas: 'Bebidas y Snacks',
};

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}
