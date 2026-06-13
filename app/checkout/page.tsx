'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/lib/store';
import {
  generateShortCode,
  generateQrToken,
  generateOrderNumber,
  calculateExpiresAt,
  checkStockAvailability,
  createReservations,
  reserveStock,
} from '@/lib/orders';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, customer, getTotal, clearCart } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia'>('transferencia');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState<any>(null);

  // Datos de invitado (guest checkout): si NO está logueado, los completa acá mismo
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  useEffect(() => {
    // Si no hay items → ir al catálogo (pero NO obligar login)
    if (items.length === 0) {
      router.push('/catalogo');
      return;
    }
    loadConfig();
  }, [items]);

  // Si el cliente logueado tiene datos, pre-llenar
  useEffect(() => {
    if (customer) {
      setGuestName(customer.full_name || '');
      setGuestPhone(customer.phone || '');
      setGuestEmail(customer.email || '');
    }
  }, [customer]);

  const loadConfig = async () => {
    const { data } = await supabase.from('web_config').select('*').limit(1).maybeSingle();
    setConfig(data);
  };

  const validateGuestData = (): string | null => {
    const name = guestName.trim();
    const phone = guestPhone.trim().replace(/\D/g, '');

    if (!name || name.length < 3) return 'Necesitamos tu nombre completo para preparar el pedido';
    if (!phone || phone.length < 8) return 'Necesitamos tu WhatsApp para coordinar la entrega';
    return null;
  };

  const handleConfirmOrder = async () => {
    setError('');

    const validationError = validateGuestData();
    if (validationError) { setError(validationError); return; }

    const stockCheck = await checkStockAvailability(items);
    if (!stockCheck.ok) {
      const names = stockCheck.insufficient.map(p => p.product_name).join(', ');
      setError(`Sin stock suficiente: ${names}. Revisá tu carrito.`);
      return;
    }

    setLoading(true);

    try {
      const total = getTotal();
      const orderNumber = generateOrderNumber();
      const shortCode = generateShortCode();
      const qrToken = generateQrToken();
      const expiresAt = await calculateExpiresAt(paymentMethod);
      const status = paymentMethod === 'transferencia' ? 'pending_payment' : 'approved';

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          short_code: shortCode,
          qr_token: qrToken,
          customer_id: customer?.id || null,           // ← puede ser null para invitados
          customer_name: guestName.trim(),
          customer_phone: guestPhone.trim(),
          customer_email: guestEmail.trim() || null,
          items,
          subtotal: total,
          total,
          payment_method: paymentMethod,
          status,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (orderError || !order) {
        setError('Error al crear pedido: ' + (orderError?.message || 'Desconocido'));
        setLoading(false);
        return;
      }

      await supabase.from('order_status_history').insert({
        order_id: order.id, from_status: null, to_status: status, notes: 'Pedido creado',
      });

      await createReservations(order.id, items.map(i => ({ product_id: i.product_id, quantity: i.quantity })), expiresAt);
      await reserveStock(items.map(i => ({ product_id: i.product_id, quantity: i.quantity })));

      clearCart();

      if (paymentMethod === 'transferencia') {
        router.push(`/pagar/${order.id}`);
      } else {
        router.push(`/confirmacion/${order.id}`);
      }
    } catch (err: any) {
      setError('Error: ' + err.message);
      setLoading(false);
    }
  };

  if (items.length === 0) return null;
  const total = getTotal();

  return (
    <>
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        <div className="mb-6">
          <Link href="/catalogo" className="text-sm text-rose-700 hover:text-rose-800 font-medium">
            ← Seguir comprando
          </Link>
          <h1 className="font-serif text-3xl font-bold text-rose-900 tracking-tight mt-2">
            Finalizar compra
          </h1>
          {!customer && (
            <p className="text-sm text-stone-600 mt-1">
              Comprá sin registrarte. <Link href="/login?redirect=/checkout" className="text-rose-700 font-semibold underline">Ya tengo cuenta</Link>
            </p>
          )}
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 mb-4 text-sm text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* Datos de contacto (siempre visible, pre-llenado si está logueado) */}
        <div className="bg-white rounded-2xl border border-rose-100 shadow-elegant p-5 mb-4">
          <h2 className="font-serif text-lg font-bold text-rose-900 mb-3">Tus datos</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Nombre completo *</label>
              <input
                type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)}
                placeholder="Ej: María González"
                className="w-full px-3.5 py-2.5 bg-rose-50/40 border border-rose-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:border-rose-500 focus:bg-white outline-none transition-colors"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">WhatsApp *</label>
                <input
                  type="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="362 4XX XXXX"
                  className="w-full px-3.5 py-2.5 bg-rose-50/40 border border-rose-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:border-rose-500 focus:bg-white outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Email <span className="text-stone-400">(opcional)</span></label>
                <input
                  type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="vos@ejemplo.com"
                  className="w-full px-3.5 py-2.5 bg-rose-50/40 border border-rose-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:border-rose-500 focus:bg-white outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-rose-100 shadow-elegant p-5 mb-4">
          <h2 className="font-serif text-lg font-bold text-rose-900 mb-3">Tu pedido</h2>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.product_id} className="flex items-center gap-3 py-2 border-b border-rose-50 last:border-0">
                <div className="w-12 h-12 bg-rose-50 rounded-lg overflow-hidden flex-shrink-0">
                  {item.product_image && <img src={item.product_image} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900 truncate">{item.product_name}</p>
                  <p className="text-xs text-stone-500">{item.quantity} × ${item.unit_price.toLocaleString('es-AR')}</p>
                </div>
                <p className="font-bold text-rose-900 text-sm">${item.subtotal.toLocaleString('es-AR')}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t-2 border-rose-100 flex justify-between items-baseline">
            <span className="text-stone-700">Total a pagar</span>
            <span className="font-serif text-3xl font-bold text-rose-900">${total.toLocaleString('es-AR')}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-rose-100 shadow-elegant p-5 mb-4">
          <h2 className="font-serif text-lg font-bold text-rose-900 mb-4">Elegí cómo pagar</h2>
          <div className="space-y-2">
            <button
              onClick={() => setPaymentMethod('transferencia')}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                paymentMethod === 'transferencia' ? 'border-rose-500 bg-rose-50' : 'border-stone-200 hover:border-rose-300'
              }`}>
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex-shrink-0 ${
                  paymentMethod === 'transferencia' ? 'border-rose-500 bg-rose-500' : 'border-stone-300'
                }`}>
                  {paymentMethod === 'transferencia' && <div className="w-2 h-2 bg-white rounded-full m-auto mt-1" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-stone-900">🏦 Transferencia bancaria</p>
                  <p className="text-xs text-stone-500 mt-1">Te damos los datos, transferís y nos enviás el comprobante por WhatsApp</p>
                  <p className="text-[10px] text-emerald-700 font-bold mt-1">Recomendado · Pagás antes y retirás sin esperar</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod('efectivo')}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                paymentMethod === 'efectivo' ? 'border-rose-500 bg-rose-50' : 'border-stone-200 hover:border-rose-300'
              }`}>
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex-shrink-0 ${
                  paymentMethod === 'efectivo' ? 'border-rose-500 bg-rose-500' : 'border-stone-300'
                }`}>
                  {paymentMethod === 'efectivo' && <div className="w-2 h-2 bg-white rounded-full m-auto mt-1" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-stone-900">💵 Efectivo al retirar</p>
                  <p className="text-xs text-stone-500 mt-1">Reservás el pedido y pagás cuando venís a buscarlo</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <button
          onClick={handleConfirmOrder}
          disabled={loading}
          className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 disabled:opacity-50 text-white py-4 rounded-xl text-base font-bold shadow-elegant-lg transition-all"
        >
          {loading ? 'Procesando…' : `Confirmar pedido · $${total.toLocaleString('es-AR')}`}
        </button>

        <p className="text-[10px] text-center text-stone-500 mt-3">
          Al confirmar aceptás coordinar el retiro por WhatsApp. ADDANI · Resistencia, Chaco.
        </p>
      </main>
      <Footer />
    </>
  );
}
