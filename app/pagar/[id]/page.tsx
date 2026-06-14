'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/lib/store';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PagarPage() {
  const params = useParams();
  const router = useRouter();
  const { customer } = useCartStore();
  
  const [order, setOrder] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string>('');
  const [whatsappClicked, setWhatsappClicked] = useState(false);

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    const [orderResult, configResult] = await Promise.all([
      supabase.from('orders').select('*').eq('id', params.id).maybeSingle(),
      supabase.from('web_config').select('*').limit(1).maybeSingle(),
    ]);

    if (!orderResult.data) {
      router.push('/');
      return;
    }

    // Si está logueado, verificamos que sea suyo. Si es invitado (customer_id null), dejamos pasar.
    if (orderResult.data.customer_id && customer && orderResult.data.customer_id !== customer.id) {
      router.push('/mis-pedidos');
      return;
    }

    setOrder(orderResult.data);
    setConfig(configResult.data);
    setLoading(false);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(''), 2000);
      if (navigator.vibrate) navigator.vibrate(50);
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(''), 2000);
    }
  };

  const handleSendWhatsapp = async () => {
    if (!order) return;

    await supabase.from('orders').update({
      status: 'pending_approval',
      updated_at: new Date().toISOString(),
    }).eq('id', order.id);

    await supabase.from('order_status_history').insert({
      order_id: order.id,
      from_status: 'pending_payment',
      to_status: 'pending_approval',
      notes: 'Cliente envio link a WhatsApp para enviar comprobante',
    });

    const message = encodeURIComponent(
      `Hola! 👋\n\n` +
      `Realicé un pedido en su tienda y quiero enviar el comprobante:\n\n` +
      `📦 Pedido: ${order.short_code}\n` +
      `👤 Cliente: ${order.customer_name}\n` +
      `💰 Total: $${Number(order.total).toLocaleString('es-AR')}\n\n` +
      `Adjunto la foto del comprobante de la transferencia.\n\n` +
      `Gracias!`
    );

    const phone = (config?.whatsapp_number || '+5493624522965').replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    
    setWhatsappClicked(true);
    setTimeout(() => router.push(`/confirmacion/${order.id}`), 2000);
  };

  if (loading || !order) {
    return (
      <>
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-rose-100 rounded-2xl" />
            <div className="h-64 bg-rose-50 rounded-2xl" />
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const alias = config?.bank_alias || 'addani.mp';
  const cvu = config?.bank_cvu || '';
  const holder = config?.bank_holder || 'Cristian Rolon';

  return (
    <>
      <Header />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24">
        
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-2xl mb-3">
            <span className="text-3xl">📋</span>
          </div>
          <p className="text-rose-700 font-semibold tracking-widest uppercase text-xs mb-1">Paso 2 de 3</p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-rose-900 tracking-tight">
            Realizá la transferencia
          </h1>
          <p className="text-stone-600 mt-2 text-sm">Seguí estos 3 pasos simples</p>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-amber-50 border border-rose-200 rounded-2xl p-5 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-rose-700 font-bold uppercase tracking-wider">Tu pedido</p>
              <p className="font-mono font-bold text-2xl text-rose-900">{order.short_code}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-rose-700 font-bold uppercase tracking-wider">Total</p>
              <p className="font-serif font-bold text-3xl text-rose-900">${Number(order.total).toLocaleString('es-AR')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-rose-200 rounded-2xl p-5 mb-4 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-rose-100 rounded-full flex items-center justify-center font-bold text-rose-700">
              1
            </div>
            <div>
              <p className="font-serif text-lg font-bold text-rose-900">Copiá los datos</p>
              <p className="text-xs text-stone-500">Tocá cada botón para copiar</p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => copyToClipboard(alias, 'alias')}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                copiedField === 'alias' ? 'border-emerald-400 bg-emerald-50' : 'border-rose-100 hover:border-rose-300 bg-rose-50/30'
              }`}
            >
              <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Alias</p>
              <div className="flex items-center justify-between mt-1">
                <p className="font-mono font-bold text-base text-stone-900">{alias}</p>
                <span className={`text-xs font-bold ${copiedField === 'alias' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {copiedField === 'alias' ? '✓ Copiado' : '📋 Copiar'}
                </span>
              </div>
            </button>

            {cvu && (
              <button
                onClick={() => copyToClipboard(cvu, 'cvu')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  copiedField === 'cvu' ? 'border-emerald-400 bg-emerald-50' : 'border-rose-100 hover:border-rose-300 bg-rose-50/30'
                }`}
              >
                <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">CVU</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="font-mono font-bold text-sm text-stone-900 truncate flex-1 mr-2">{cvu}</p>
                  <span className={`text-xs font-bold whitespace-nowrap ${copiedField === 'cvu' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {copiedField === 'cvu' ? '✓ Copiado' : '📋 Copiar'}
                  </span>
                </div>
              </button>
            )}

            <button
              onClick={() => copyToClipboard(String(order.total), 'monto')}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                copiedField === 'monto' ? 'border-emerald-400 bg-emerald-50' : 'border-rose-100 hover:border-rose-300 bg-rose-50/30'
              }`}
            >
              <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Monto exacto</p>
              <div className="flex items-center justify-between mt-1">
                <p className="font-mono font-bold text-base text-stone-900">${Number(order.total).toLocaleString('es-AR')}</p>
                <span className={`text-xs font-bold ${copiedField === 'monto' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {copiedField === 'monto' ? '✓ Copiado' : '📋 Copiar'}
                </span>
              </div>
            </button>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
              <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Titular</p>
              <p className="font-medium text-stone-900 mt-1">{holder}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-rose-200 rounded-2xl p-5 mb-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-rose-100 rounded-full flex items-center justify-center font-bold text-rose-700">
              2
            </div>
            <div>
              <p className="font-serif text-lg font-bold text-rose-900">Hacé la transferencia</p>
              <p className="text-xs text-stone-500">Desde tu app del banco</p>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900 leading-relaxed">
            <p className="font-semibold mb-1">💡 Recordá:</p>
            <ul className="space-y-0.5 ml-4 list-disc text-xs">
              <li>Transferí el <strong>monto exacto</strong></li>
              <li>Guardá el comprobante (foto o captura)</li>
              <li>El alias o CVU debe ser exactamente como copiaste</li>
            </ul>
          </div>
        </div>

        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center font-bold text-emerald-700">
              3
            </div>
            <div>
              <p className="font-serif text-lg font-bold text-emerald-900">Enviá el comprobante</p>
              <p className="text-xs text-emerald-700">Una vez transferido</p>
            </div>
          </div>

          <p className="text-sm text-emerald-900 mb-4 leading-relaxed">
            Cuando termines la transferencia, tocá el botón y mandanos la foto del comprobante por WhatsApp. Te respondemos en minutos confirmando el pago y enviándote tu código.
          </p>

          <button
            onClick={handleSendWhatsapp}
            disabled={whatsappClicked}
            className={`w-full py-5 rounded-2xl font-bold shadow-lg text-base flex items-center justify-center gap-3 transition-all ${
              whatsappClicked 
                ? 'bg-emerald-700 text-white' 
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white hover:scale-[1.02]'
            }`}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
            {whatsappClicked ? '✓ Redirigiendo...' : 'Enviar comprobante por WhatsApp'}
          </button>

          <p className="text-xs text-emerald-700 text-center mt-3">
            🔒 Al enviar, tu pedido entra en revisión y reservamos tus productos por 48 horas
          </p>
        </div>

        <div className="text-center">
          <Link href="/mis-pedidos" className="text-sm text-stone-500 hover:text-rose-700 underline">
            Ver mis pedidos
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}