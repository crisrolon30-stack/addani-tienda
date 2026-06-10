import { supabase } from './supabase';

export function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'AD';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateQrToken(): string {
  return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

export function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `P${year}${month}${day}-${random}`;
}

export async function calculateExpiresAt(paymentMethod: 'efectivo' | 'transferencia'): Promise<string> {
  const date = new Date();
  if (paymentMethod === 'transferencia') {
    date.setHours(date.getHours() + 48);
  } else {
    date.setHours(date.getHours() + 24);
  }
  return date.toISOString();
}

export async function checkStockAvailability(items: { product_id: string; quantity: number }[]): Promise<{ ok: boolean; insufficient: { product_id: string; product_name: string; requested: number; available: number }[] }> {
  const insufficient: any[] = [];

  for (const item of items) {
    const { data: product } = await supabase
      .from('products')
      .select('id, name, stock')
      .eq('id', item.product_id)
      .maybeSingle();

    if (!product || product.stock < item.quantity) {
      insufficient.push({
        product_id: item.product_id,
        product_name: product?.name || 'Producto no disponible',
        requested: item.quantity,
        available: product?.stock || 0,
      });
    }
  }

  return { ok: insufficient.length === 0, insufficient };
}

export async function createReservations(orderId: string, items: { product_id: string; quantity: number }[], expiresAt: string) {
  const reservations = items.map(item => ({
    order_id: orderId,
    product_id: item.product_id,
    quantity: item.quantity,
    expires_at: expiresAt,
  }));
  
  await supabase.from('stock_reservations').insert(reservations);
}

export async function reserveStock(items: { product_id: string; quantity: number }[]) {
  for (const item of items) {
    const { data: product } = await supabase
      .from('products')
      .select('stock')
      .eq('id', item.product_id)
      .maybeSingle();

    if (product) {
      const newStock = Math.max(0, product.stock - item.quantity);
      await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.product_id);
    }
  }
}

export async function releaseStock(items: { product_id: string; quantity: number }[]) {
  for (const item of items) {
    const { data: product } = await supabase
      .from('products')
      .select('stock')
      .eq('id', item.product_id)
      .maybeSingle();

    if (product) {
      await supabase
        .from('products')
        .update({ stock: product.stock + item.quantity })
        .eq('id', item.product_id);
    }
  }
}

export function buildWhatsAppMessage(order: any, config: any): string {
  const items = order.items.map((i: any) => 
    `- ${i.quantity}x ${i.product_name} ($${i.subtotal.toLocaleString('es-AR')})`
  ).join('\n');

  let msg = `Hola ${config.store_name}! Hice un pedido en la web:\n\n`;
  msg += `Codigo: ${order.short_code}\n`;
  msg += `Total: $${order.total.toLocaleString('es-AR')}\n`;
  msg += `Pago: ${order.payment_method}\n\n`;
  msg += `Productos:\n${items}\n\n`;
  
  if (order.payment_method === 'transferencia') {
    msg += `Voy a pagar por transferencia y subir el comprobante.`;
  } else {
    msg += `Voy a pasar a retirar y pagar en efectivo.`;
  }
  
  return encodeURIComponent(msg);
}