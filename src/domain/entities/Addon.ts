const WP = 'https://berlioz.mx/wp-content/uploads';

export interface Addon {
  id: string;
  title: string;
  subtitle: string;
  pricePerPerson: number | null; // null = custom quote
  priceLabel: string;
  isFree?: boolean;
  image?: string;
  /** If true, this addon has special interactive logic in AddonsBar */
  isInteractive?: boolean;
}

export const ADDONS: Addon[] = [
  {
    id: 'cafe_te_berlioz',
    title: 'Café/Té Berlioz',
    subtitle: 'Caja con café o agua para té (12 tazas). Precio fijo por unidad.',
    pricePerPerson: null,
    priceLabel: '$540/caja',
    image: `${WP}/2015/01/17.jpg`,
    isInteractive: true,
  },
  {
    id: 'snack_bag',
    title: 'Snack Bag Individual',
    subtitle: 'Bolsita individual de break',
    pricePerPerson: 140,
    priceLabel: '+$140/pza',
    image: `${WP}/2023/12/bag-snack.jpg`,
  },
  {
    id: 'surtido_snacks',
    title: 'Surtido de Snacks',
    subtitle: 'Botana sana para compartir (6-8 personas)',
    pricePerPerson: null,
    priceLabel: '$300/surtido',
    isInteractive: true,
  },
  {
    id: 'logo_caja',
    title: 'Mi logo en la tapa',
    subtitle: 'Personaliza tus cajas con tu marca (mín. 50 pzas)',
    pricePerPerson: null,
    priceLabel: 'Desde $10/pza',
    image: `${WP}/2016/01/PersonalizacionDeCajas.jpg`,
    isInteractive: true,
  },
  {
    id: 'sticker',
    title: 'Sticker personalizado',
    subtitle: 'Te pasamos las medidas de la tapa',
    pricePerPerson: 10,
    priceLabel: '$10/pza',
    image: `${WP}/2016/01/PersonalizacionDeCajas.jpg`,
  },
  {
    id: 'aguas_frescas',
    title: 'Aguas frescas',
    subtitle: 'Jamaica, limón con menta, coco, temporada',
    pricePerPerson: 45,
    priceLabel: '+$45/pza',
    image: `${WP}/2023/03/Aguas-de-sabor-Berlioz.jpg.webp`,
  },
  {
    id: 'personal_servicio',
    title: 'Personal de servicio',
    subtitle: 'Meseros y/o personal de limpieza para tu evento',
    pricePerPerson: null,
    priceLabel: 'Desde $500/persona',
    isInteractive: true,
  },
];

// Logo pricing tiers
export const LOGO_TIERS = [
  { id: 'sticker', label: 'Sticker', pricePerPiece: 10 },
  { id: 'bolsa', label: 'Bolsa', pricePerPiece: 18 },
  { id: 'cajas_i', label: 'Cajas I', pricePerPiece: 22 },
  { id: 'cajas_ii', label: 'Cajas II', pricePerPiece: 27 },
  { id: 'cajas_iii', label: 'Cajas III', pricePerPiece: 44 },
  { id: 'cajas_iv', label: 'Cajas IV', pricePerPiece: 60 },
  { id: 'placa', label: 'Placa', pricePerPiece: 680 },
] as const;

// Staff pricing tiers
export const STAFF_TIERS = [
  { id: '2h', label: '2 horas', price: 500 },
  { id: '4h', label: '1-4 horas', price: 800 },
  { id: '8h', label: '4-8 horas', price: 1600 },
] as const;

// Delivery pricing
export const DELIVERY_TIERS = [
  { id: 'entrega_1', label: 'Entrega 1', price: 280 },
  { id: 'entrega_2', label: 'Entrega 2', price: 300 },
  { id: 'entrega_3', label: 'Entrega 3', price: 360 },
  { id: 'entrega_4', label: 'Entrega 4', price: 400 },
  { id: 'entrega_5', label: 'Entrega 5', price: 500 },
  { id: 'entrega_6', label: 'Entrega 6', price: 690 },
  { id: 'jiutepec', label: 'Jiutepec', price: 2600 },
  { id: 'queretaro', label: 'Querétaro', price: 5300 },
] as const;
