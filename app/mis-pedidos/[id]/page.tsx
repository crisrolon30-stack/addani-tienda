'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Order } from '@/types';
import { useCartStore } from '@/lib/store';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PedidoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { customer } = useCartStore();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (!customer) {
      router.push('/login');
      return;
    }
    loadData();
  }, [customer]);

  useEffect(() => {
    if (!order) return;
    const interval = setInterval(() => loadData(), 30000);
    return () => clearInterval(interval);
  }, [order?.status]);

  const loadData = async () => {
    setLoading(true);
    const [orderResult, configResult] = await Promise.all([
      supabase.from('orders').select('*').eq('id', params.id).maybeSingle(),
      supabase.from('web_config').select('*').limit(1).maybeSingle(),
    ]);

    const orderData = orderResult.data;
    const configData = configResult.data;

    if (!orderData || orderData.customer_id !== customer?.id) {
      router.push('/mis-pedidos');
      return;
    }

    setOrder(orderData);
    setConfig(configData);

    if (orderData.status === 'approved' || orderData.status === 'ready_to_pickup') {
      const QRCode = (await import('qrcode')).default;
      const url = await QRCode.toDataURL(orderData.qr_token, {
        width: 400,
        margin: 2,
        color: { dark: '#be123c', light: '#ffffff' },
      });
      setQrDataUrl(url);
    }
    setLoading(false);
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!order) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es muy grande. Maximo 5MB.');
      return;
    }

    setUploading(true);

    try {
      const fileName = `comprobante-${order.id}-${Date.now()}.${file.name.split('.').pop()}`;
      
      const uploadResult = await supabase.storage
        .from('imagenes-de-productos')
        .upload(`comprobantes/${fileName}`, file);

      if (uploadResult.error) {
        alert('Error al subir: ' + uploadResult.error.message);
        setUploading(false);
        return;
      }

      const urlResult = supabase.storage
        .from('imagenes-de-productos')
        .getPublicUrl(`comprobantes/${fileName}`);

      const publicUrl = urlResult.data.publicUrl;

      await supabase
        .from('orders')
        .update({
          payment_proof_url: publicUrl,
          payment_proof_uploaded_at: new Date().toISOString(),
          status: 'pending_approval',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      await supabase.from('order_status_history').insert({
        order_id: order.id,
        from_status: 'pending_payment',
        to_status: 'pending_approval',
        notes: 'Comprobante subido',
      });

      await loadData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = async () => {
    if (!order || !cancelReason.trim()) return;

    for (const item of order.items) {
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

    await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancelled_by_customer: true,
        cancellation_reason: cancelReason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    await supabase.from('order_status_history').insert({
      order_id: order.id,
      from_status: order.status,
      to_status: 'cancelled',
      notes: 'Cancelado por cliente: ' + cancelReason,
    });

    await supabase
      .from('stock_reservations')
      .delete()
      .eq('order_id', order.id);

    setShowCancel(false);
    setCancelReason('');
    await loadData();
  };

  if (loading || !order) {
    return (
      <>
        <Header />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-rose-100 rounded w-2/3" />
            <div className="h-64 bg-rose-100 rounded-2xl" />
          </div>
        </div>
      </>
    );
  }

  const canCancel = ['pending_payment', 'pending_approval', 'approved'].includes(order.status);
  const isPendingPayment = order.status === 'pending_payment';
  const isPendingApproval = order.status === 'pending_approval';
  const isApproved = ['approved', 'ready_to_pickup'].includes(order.status);
  const isRejected = order.status === 'rejected';

  return (
    <>
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        <Link href="/mis-pedidos" className="text-sm text-rose-700 hover:text-rose-800 font-semibold mb-4 inline-block">
          Volver a mis pedidos
        </Link>

        <div className="mb-6">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-rose-900 tracking-tight">
            Pedido {order.short_code}
          </h1>
          <p className="text-stone-600 mt-1">
            {new Date(order.created_at).toLocaleString('es-AR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {isApproved && (
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-6 mb-6 text-center">
            <p className="text-emerald-700 text-xs font-bold uppercase tracking-widest mb-3">Aprobado</p>
            <p className="font-serif text-2xl font-bold text-emerald-900 mb-4">Tu pedido esta listo para retirar</p>
            
            <div className="bg-white rounded-2xl p-4 inline-block shadow-elegant mb-4">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Tu codigo</p>
              <p className="font-mono font-bold text-4xl text-rose-900 tracking-widest">{order.short_code}</p>
            </div>

            {qrDataUrl && (
              <div className="mt-4">
                <p className="text-sm text-emerald-900 mb-3">O mostra este QR al empleado:</p>
                <img src={qrDataUrl} alt="QR" className="w-72 h-72 mx-auto rounded-2xl shadow-elegant bg-white p-3" />
              </div>
            )}

            <div className="mt-5 bg-white/60 rounded-xl p-4 text-left">
              <p className="font-bold text-emerald-900 mb-2 text-sm">Como retirar:</p>
              <ol className="text-sm text-emerald-900 space-y-1 leading-relaxed">
                <li>1. Anda al local en horario de atencion</li>
                <li>2. Mostra este QR o deci el codigo {order.short_code}</li>
                <li>3. {order.payment_method === 'transferencia' ? 'Ya pagaste, solo retiras' : 'Pagas en efectivo, debito o credito'}</li>
                <li>4. Te llevas tus productos</li>
              </ol>
            </div>
          </div>
        )}

        {isPendingPayment && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 mb-6">
            <p className="font-serif text-2xl font-bold text-amber-900 mb-2">Subi tu comprobante</p>
            <p className="text-sm text-amber-800 mb-4 leading-relaxed">
              Haces la transferencia y subi la foto del comprobante para que aprobemos tu pago.
            </p>

            <div className="bg-white rounded-xl p-4 mb-4 space-y-2">
              <div>
                <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Transferir a:</p>
                <p className="font-mono font-bold text-amber-900 text-lg">{config?.bank_alias}</p>
              </div>
              {config?.bank_cvu && (
                <div>
                  <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">CVU:</p>
                  <p className="font-mono font-bold text-amber-900">{config.bank_cvu}</p>
                </div>
              )}
              <div className="pt-2 border-t border-amber-100">
                <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Monto exacto:</p>
                <p className="font-bold text-amber-900 text-2xl">${Number(order.total).toLocaleString('es-AR')}</p>
              </div>
            </div>

            <label className={'block w-full bg-amber-600 hover:bg-amber-700 text-white py-4 rounded-xl font-bold text-center cursor-pointer shadow-elegant-lg transition-colors ' + (uploading ? 'opacity-50' : '')}>
              {uploading ? 'Subiendo...' : 'Subir foto del comprobante'}
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadProof}
                disabled={uploading}
                className="hidden"
              />
            </label>

            <p className="text-xs text-amber-700 text-center mt-3">
              Aceptamos imagenes hasta 5MB
            </p>
          </div>
        )}

        {isPendingApproval && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-6 text-center">
            <span className="text-5xl">🔍</span>
            <p className="font-serif text-2xl font-bold text-blue-900 mt-3">Verificando tu pago</p>
            <p className="text-sm text-blue-800 mt-2 leading-relaxed">
              Estamos revisando tu comprobante. Te avisamos por WhatsApp en cuanto este aprobado.
            </p>
            {order.payment_proof_url && (
              <div className="mt-4">
                <p className="text-xs text-blue-700 font-semibold uppercase tracking-wider mb-2">Comprobante enviado:</p>
                <a href={order.payment_proof_url} target="_blank" className="inline-block">
                  <img src={order.payment_proof_url} alt="Comprobante" className="max-w-xs rounded-xl shadow-elegant border-2 border-blue-200" />
                </a>
              </div>
            )}
          </div>
        )}

        {isRejected && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-6 mb-6">
            <p className="font-serif text-2xl font-bold text-rose-900">Pago rechazado</p>
            <p className="text-sm text-rose-800 mt-2">
              {order.rejected_reason || 'Tu comprobante no fue valido. Contactanos por WhatsApp.'}
            </p>
            <a
              href={'https://wa.me/5493624522965?text=Hola!%20Tengo%20una%20duda%20sobre%20mi%20pedido%20' + order.short_code}
              target="_blank"
              className="block mt-4 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-center"
            >
              Contactar por WhatsApp
            </a>

          </div>
        )}

        <div className="bg-white rounded-2xl shadow-elegant border border-rose-100 p-5 mb-4">
          <h2 className="font-serif text-xl font-bold text-rose-900 mb-3">Productos</h2>
          <div className="space-y-2">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 py-2 border-b border-rose-50 last:border-0">
                <div className="w-12 h-12 bg-rose-50 rounded-lg overflow-hidden flex-shrink-0">
                  {item.product_image && <img src={item.product_image} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-900 truncate">{item.product_name}</p>
                  <p className="text-xs text-stone-500">{item.quantity} x ${item.unit_price.toLocaleString('es-AR')}</p>
                </div>
                <p className="font-bold text-rose-900">${item.subtotal.toLocaleString('es-AR')}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t-2 border-rose-100 flex justify-between items-baseline">
            <span className="font-bold text-stone-700">Total</span>
            <span className="font-serif text-3xl font-bold text-rose-900">${Number(order.total).toLocaleString('es-AR')}</span>
          </div>
        </div>

        {canCancel && !showCancel && (
          <button
            onClick={() => setShowCancel(true)}
            className="w-full bg-white hover:bg-rose-50 border-2 border-rose-200 text-rose-700 py-3 rounded-xl font-semibold transition-colors"
          >
            Cancelar pedido
          </button>
        )}

        {showCancel && (
          <div className="bg-white border-2 border-rose-300 rounded-2xl p-5">
            <p className="font-serif text-xl font-bold text-rose-900 mb-3">Por que cancelas?</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-4 py-3 bg-rose-50/30 border border-rose-200 rounded-xl focus:bg-white focus:border-rose-500 resize-none"
              rows={3}
              placeholder="Contanos por que..."
              autoFocus
            />
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setShowCancel(false); setCancelReason(''); }} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-3 rounded-xl font-semibold">
                Volver
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason.trim()}
                className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold"
              >
                Si, cancelar
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}