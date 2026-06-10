'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/lib/store';
import { Order, OrderStatus } from '@/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const STATUS_INFO: Record<OrderStatus, { label: string; color: string; icon: string; description: string }> = {
  pending_payment: {
    label: 'Esperando tu pago',
    color: 'amber',
    icon: '⏳',
    description: 'Subí el comprobante de transferencia',
  },
  pending_approval: {
    label: 'Verificando pago',
    color: 'blue',
    icon: '🔍',
    description: 'Estamos revisando tu comprobante',
  },
  approved: {
    label: '¡Listo para retirar!',
    color: 'emerald',
    icon: '✅',
    description: 'Pasá por el local con tu código',
  },
  ready_to_pickup: {
    label: '¡Listo para retirar!',
    color: 'emerald',
    icon: '✅',
    description: 'Pasá por el local con tu código',
  },
  delivered: {
    label: 'Entregado',
    color: 'gray',
    icon: '✓',
    description: 'Gracias por tu compra',
  },
  cancelled: {
    label: 'Cancelado',
    color: 'rose',
    icon: '✕',
    description: 'Pedido cancelado',
  },
  expired: {
    label: 'Expirado',
    color: 'gray',
    icon: '⏰',
    description: 'El tiempo de pago expiró',
  },
  rejected: {
    label: 'Pago rechazado',
    color: 'rose',
    icon: '⚠️',
    description: 'Tu comprobante no fue válido',
  },
};

export default function MisPedidosPage() {
  const router = useRouter();
  const { customer } = useCartStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  useEffect(() => {
    if (!customer) {
      router.push('/login?redirect=/mis-pedidos');
      return;
    }
    loadOrders();
  }, [customer]);

  const loadOrders = async () => {
    if (!customer) return;
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  if (!customer) return null;

  const activeStatuses = ['pending_payment', 'pending_approval', 'approved', 'ready_to_pickup'];
  const filtered = orders.filter(o => {
    if (filter === 'active') return activeStatuses.includes(o.status);
    if (filter === 'completed') return ['delivered', 'cancelled', 'expired', 'rejected'].includes(o.status);
    return true;
  });

  return (
    <>
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        
        <div className="mb-8">
          <p className="text-rose-700 font-semibold tracking-widest uppercase text-xs mb-2">Mis compras</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-rose-900 tracking-tight">
            Mis pedidos
          </h1>
          <p className="text-stone-600 mt-2">Acá ves todas tus compras</p>
        </div>

        <div className="bg-white rounded-2xl shadow-elegant border border-rose-100 p-1.5 mb-6 grid grid-cols-3 gap-1">
          <button
            onClick={() => setFilter('active')}
            className={`py-3 rounded-xl text-sm font-bold transition-colors ${
              filter === 'active' ? 'bg-rose-600 text-white shadow-elegant' : 'text-stone-600 hover:bg-rose-50'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`py-3 rounded-xl text-sm font-bold transition-colors ${
              filter === 'completed' ? 'bg-rose-600 text-white shadow-elegant' : 'text-stone-600 hover:bg-rose-50'
            }`}
          >
            Historial
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`py-3 rounded-xl text-sm font-bold transition-colors ${
              filter === 'all' ? 'bg-rose-600 text-white shadow-elegant' : 'text-stone-600 hover:bg-rose-50'
            }`}
          >
            Todos
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl shadow-elegant p-5 animate-pulse">
                <div className="h-6 bg-rose-100 rounded w-1/3 mb-3" />
                <div className="h-4 bg-rose-100 rounded w-1/2 mb-2" />
                <div className="h-4 bg-rose-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-elegant border border-rose-100 p-12 text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📦</span>
            </div>
            <p className="font-serif text-xl text-rose-900 font-bold mb-2">
              {filter === 'active' ? 'No tenés pedidos activos' : 'Sin pedidos en esta sección'}
            </p>
            <p className="text-stone-600 text-sm mb-5">
              {filter === 'active' ? '¿Querés empezar a comprar?' : 'Cuando tengas pedidos van a aparecer acá'}
            </p>
            <Link href="/catalogo" className="inline-block bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-elegant">
              Ver catálogo →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}

function OrderCard({ order }: { order: Order }) {
  const info = STATUS_INFO[order.status];
  const colorMap: Record<string, string> = {
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    gray: 'bg-stone-50 border-stone-200 text-stone-700',
    rose: 'bg-rose-50 border-rose-200 text-rose-900',
  };

  const itemCount = order.items.reduce((s: number, i: any) => s + i.quantity, 0);
  const date = new Date(order.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <Link
      href={`/mis-pedidos/${order.id}`}
      className="block bg-white rounded-2xl shadow-elegant hover:shadow-elegant-lg border border-rose-50 hover:border-rose-200 transition-all overflow-hidden"
    >
      <div className={`px-5 py-3 ${colorMap[info.color]} border-b border-current/10 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="text-xl">{info.icon}</span>
          <p className="font-bold text-sm">{info.label}</p>
        </div>
        <p className="text-xs font-mono opacity-70">{date}</p>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Pedido</p>
            <p className="font-mono font-bold text-stone-900">{order.short_code}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Total</p>
            <p className="font-serif font-bold text-2xl text-rose-900">${Number(order.total).toLocaleString('es-AR')}</p>
          </div>
        </div>

        <p className="text-sm text-stone-600 mb-3">
          {itemCount} {itemCount === 1 ? 'producto' : 'productos'} · Pago: {order.payment_method}
        </p>

        <p className={`text-sm ${colorMap[info.color].split(' ').find(c => c.startsWith('text-'))}`}>
          {info.description}
        </p>

        <div className="mt-3 pt-3 border-t border-rose-50 flex items-center justify-between">
          <p className="text-xs text-stone-500">Ver detalle</p>
          <span className="text-rose-600 font-bold">→</span>
        </div>
      </div>
    </Link>
  );
}