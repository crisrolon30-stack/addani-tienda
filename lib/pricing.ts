// lib/pricing.ts
// Cálculo de precio según cantidad y ofertas (DRY: lo usa catálogo, carrito, checkout)

export type QuantityOffer = {
  min_qty: number;
  price_total: number;
  label?: string;
};

export type PricedItem = {
  unit_price: number;
  subtotal: number;
  base_unit_price: number;
  saved: number;
  applied_offer?: QuantityOffer;
};

export function priceItem(
  basePrice: number,
  quantity: number,
  offers?: QuantityOffer[] | null
): PricedItem {
  const base = Number(basePrice) || 0;
  const qty = Math.max(0, Math.floor(quantity));
  const normal = base * qty;

  if (!offers || !Array.isArray(offers) || offers.length === 0 || qty === 0) {
    return { unit_price: base, subtotal: normal, base_unit_price: base, saved: 0 };
  }

  const sorted = [...offers]
    .filter(o => o.min_qty > 0 && o.price_total > 0)
    .sort((a, b) => b.min_qty - a.min_qty);

  let remaining = qty;
  let total = 0;
  let appliedOffer: QuantityOffer | undefined;

  for (const offer of sorted) {
    if (remaining >= offer.min_qty) {
      const packs = Math.floor(remaining / offer.min_qty);
      total += packs * offer.price_total;
      remaining -= packs * offer.min_qty;
      if (packs > 0 && !appliedOffer) appliedOffer = offer;
    }
  }
  total += remaining * base;

  const subtotal = total;
  const unitPrice = qty > 0 ? subtotal / qty : base;
  const saved = normal - subtotal;

  return {
    unit_price: Math.round(unitPrice * 100) / 100,
    subtotal: Math.round(subtotal),
    base_unit_price: base,
    saved: Math.round(saved),
    applied_offer: appliedOffer,
  };
}

export function offerLabel(offer: QuantityOffer): string {
  if (offer.label) return offer.label;
  return `${offer.min_qty} x $${offer.price_total.toLocaleString('es-AR')}`;
}

export function bestOfferText(basePrice: number, offers?: QuantityOffer[] | null): string | null {
  if (!offers || !Array.isArray(offers) || offers.length === 0) return null;
  const sorted = [...offers]
    .filter(o => o.min_qty > 0 && o.price_total > 0)
    .sort((a, b) => a.min_qty - b.min_qty);
  if (sorted.length === 0) return null;
  const o = sorted[0];
  return `Llevá ${o.min_qty} a $${o.price_total.toLocaleString('es-AR')}`;
}
