import { getShippingZoneByCP, SHIPPING_ZONES } from "@/constants/shippingZones";

export interface ShippingInfo {
  zone: number | null;
  price: number | null;
  hasPickup: boolean;
  isValid: boolean;
  message?: string;
}

export function getShippingInfo(postalCode: string): ShippingInfo {
  const cp = postalCode.trim();

  if (!cp || cp.length !== 5) {
    return { zone: null, price: null, hasPickup: false, isValid: false, message: "Ingresa un código postal de 5 dígitos." };
  }

  const matched = getShippingZoneByCP(cp);

  // Zone 0: special pricing
  if (matched && matched.zone === 0) {
    return {
      zone: 0,
      price: null,
      hasPickup: false,
      isValid: true,
      message: "Tu CP requiere cotización especial. Contáctanos al 55 8237 5469.",
    };
  }

  if (matched) {
    const info: ShippingInfo = {
      zone: matched.zone,
      price: matched.price,
      hasPickup: matched.hasPickup,
      isValid: true,
    };
    if (matched.price !== null && matched.price >= 690) {
      info.message = `Tu zona tiene un costo de envío de $${matched.price}. Puedes ahorrar recogiendo en Lago Onega 265, Modelo Pensil, CDMX.`;
    }
    return info;
  }

  // Fallback: zone 3 default
  const defaultZone = SHIPPING_ZONES.find(z => z.isDefault);
  return {
    zone: defaultZone?.zone ?? 3,
    price: defaultZone?.price ?? 360,
    hasPickup: true,
    isValid: true,
    message: "Envío estándar para tu zona.",
  };
}
