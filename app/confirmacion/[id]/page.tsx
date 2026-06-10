'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Order } from '@/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ConfirmacionPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    loadOrder();
    loadConfig();
  }, [params.id]);

  const loadOrder = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .maybeSingle();
    
    if (data) {
      setOrder(data);
      if (data.status === 'approved' || data.status === 'ready_to_pickup') {
        const QRCode = (await import('qrcode')).default;
        const url = await QRCode.toDataURL(data.qr_token, {
          width: 400,
          margin: 2,
          color: { dark: '#be123c', light: '#ffffff' },
        });
        setQrDataUrl(url);
      }
    }
    setLoading(false);
  };

  const loadConfig = async () => {
    const { data } = await supabase.from('web_config').select('*').limit(1).maybeSingle();
    setConfig(data);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-rose-100 rounded w-2/3 mx-auto" />
            <div className="h-64 bg-rose-100 rounded-2xl" />
          </div>
        </div>
      </>
    );
  }

  if (!order) return null;

  const isPendingPayment = order.status === 'pending_payment';
  const isApproved = order.status === 'approved' || order.status === 'ready_to_pickup';

  return (
    <>
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-rose-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-elegant-lg">
            <span className="text-4xl">{isApproved ? '🎉' : '⏳'}</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-rose-900 tracking-tight">
            {isApproved ? '¡Pedido confirmado!' : isPendingPayment ? 'Pedido recibido' : 'En procesamiento'}
          </h1>
          <p className="text-stone-700 mt-2">
            {isApproved ? 'Pasá a retirar cuando puedas' : 'Esperamos tu pago'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-elegant-lg border border-rose-100 p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-5 pb-5 border-b border-rose-100">
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">N° Pedido</p>
              <p className="font-mono font-bold text-stone-900">{order.order_number}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Total</p>
              <p className="font-serif font-bold text-2xl text-rose-900">${Number(order.total).toLocaleString('es-AR')}</p>
            </div>
          </div>

          {isApproved && (
            <div className="text-center py-6">
              <p className="text-xs text-rose-700 font-bold uppercase tracking-widest mb-3">Tu código de retiro</p>
              <div className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl p-6 mb-4">
                <p className="font-mono font-bold text-4xl text-rose-900 tracking-widest">{order.short_code}</p>
              </div>
              {qrDataUrl && (
                <>
                  <p className="text-xs text-stone-600 mb-3">O mostrá este QR en el local:</p>
                  <img src={qrDataUrl} alt="QR" className="w-64 h-64 mx-auto rounded-xl shadow-elegant" />
                </>
              )}
            </div>
          )}

          {isPendingPayment && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <p className="font-bold text-amber-900 mb-3 text-lg">📋 Próximos pasos</p>
              <ol className="space-y-2 text-sm text-amber-900">
                <li><strong>1.</strong> Hacé la transferencia a:</li>
                <li className="pl-4 font-mono">{config?.bank_alias || 'addani.mp'}</li>
                <li><strong>2.</strong> Volvé a esta página y subí el comprobante</li>
                <li><strong>3.</strong> Confirmamos tu pago en minutos</li>
                <li><strong>4.</strong> Te enviamos QR y código por WhatsApp</li>
              </ol>
              <Link href={`/mis-pedidos`} className="block mt-4 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-bold text-center">
                Subir comprobante de pago
              </Link>
            </div>
          )}
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6">
          <p className="font-bold text-emerald-900 mb-3">💬 ¿Tenés dudas?</p>
          <a
            href={`https://wa.me/5493624522965?text=Hola%20ADDANI!%20Sobre%20mi%20pedido%20${order.short_code}`}
            target="_blank"
            className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-center"
          >
            Contactanos por WhatsApp
          </a>
        </div>

        <div className="flex gap-3">
          <Link href="/mis-pedidos" className="flex-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 py-3 rounded-xl font-semibold text-center">
            Ver mis pedidos
          </Link>
          <Link href="/catalogo" className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-semibold text-center shadow-elegant">
            Seguir comprando
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}