const CDN = 'https://res.cloudinary.com/dsr7tnfh6/image/upload/w_800,q_auto,f_auto';

export interface Addon {
  id: string;
  title: string;
  subtitle: string;
  pricePerPerson: number | null; // null = custom quote
  priceLabel: string;
  isFree?: boolean;
  image?: string;
}

export const ADDONS: Addon[] = [
  {
    id: 'cafe_ilimitado',
    title: 'Café y té ilimitado',
    subtitle: 'Servicio continuo durante todo el evento',
    pricePerPerson: 250,
    priceLabel: '+$250/persona',
    image: `${CDN}/coffeebreak_AM_cafe_zhxb1e`,
  },
  {
    id: 'snack_bag',
    title: 'Snack bag individual',
    subtitle: 'Bolsa personalizada con snacks variados',
    pricePerPerson: 140,
    priceLabel: '+$140/persona',
    image: `${CDN}/bag-snack_zbsxe6`,
  },
  {
    id: 'tapas_logo',
    title: 'Tapas con tu logo',
    subtitle: 'Impresión desde 50 piezas · 10 días hábiles',
    pricePerPerson: null,
    priceLabel: 'Cotización especial',
    image: `${CDN}/PersonalizacionDeCajas_br9mlr`,
  },
  {
    id: 'sticker',
    title: 'Sticker personalizado',
    subtitle: 'Te pasamos las medidas de la tapa',
    pricePerPerson: 0,
    priceLabel: 'Sin costo',
    isFree: true,
  },
  {
    id: 'aguas_frescas',
    title: 'Aguas frescas',
    subtitle: 'Variedad de sabores naturales',
    pricePerPerson: 50,
    priceLabel: '+$50/persona',
    image: `${CDN}/Aguas-de-sabor-Berlioz.jpg_guf7kw`,
  },
];
