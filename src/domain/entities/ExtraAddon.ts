export interface ExtraAddon {
  id: string;
  title: string;
  subtitle: string;
  note: string;
  price: string;
  cta?: string;
}

export const AVAILABLE_EXTRAS: ExtraAddon[] = [
  {
    id: 'tapas_logo',
    title: 'Tapas personalizadas con tu logo',
    subtitle: 'Impresión desde 50 piezas · 10 días hábiles de producción',
    note: '¿No tienes tiempo? Podemos poner un sticker sobre la caja.',
    price: 'Cotización personalizada',
    cta: 'Solicitar cotización · hola@berlioz.mx',
  },
  {
    id: 'sticker_caja',
    title: 'Sticker personalizado en caja',
    subtitle: 'Más rápido que tapas impresas · tú mandas a hacer el sticker',
    note: 'Te pasamos las medidas de la tapa',
    price: 'Sin costo adicional de Berlioz',
  },
];
