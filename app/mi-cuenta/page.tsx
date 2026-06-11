'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/lib/store';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function MiCuentaPage() {
  const router = useRouter();
  const { customer, setCustomer, logout } = useCartStore();

  const [orderCount, setOrderCount] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!customer) {
      router.push('/login?redirect=/mi-cuenta');
      return;
    }
    setForm({ full_name: customer.full_name, phone: customer.phone || '' });
    loadStats();
  }, [customer]);

  const loadStats = async () => {
    if (!customer) return;
    const ticketFilter = customer.dni
      ? `customer_id.eq.${customer.id},customer_dni.eq.${customer.dni}`
      : `customer_id.eq.${customer.id}`;
    const [orders, tickets] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('customer_id', customer.id),
      supabase.from('repair_tickets').select('id', { count: 'exact', head: true }).or(ticketFilter),
    ]);
    setOrderCount(orders.count || 0);
    setTicketCount(tickets.count || 0);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!customer) return;
    if (!form.full_name.trim()) { setMsg('El nombre no puede estar vacío'); return; }
    setSaving(true);
    setMsg('');

    const { data, error } = await supabase
      .from('web_customers')
      .update({
        full_name: form.full_name.trim(),
        phone: form.phone.replace(/\D/g, '').trim(),
      })
      .eq('id', customer.id)
      .select()
      .single();

    if (error || !data) {
      setMsg('Error al guardar. Probá de nuevo.');
      setSaving(false);
      return;
    }

    setCustomer(data);
    setEditing(false);
    setSaving(false);
    setMsg('✓ Datos actualizados');
    setTimeout(() => setMsg(''), 2500);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!customer) return null;

  return (
    <>
      <Header />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        <div className="mb-6">
          <Link href="/" className="text-sm text-rose-700 hover:text-rose-800 font-medium">
            ← Volver al inicio
          </Link>
          <h1 className="font-serif text-3xl font-bold text-rose-900 tracking-tight mt-2">
            Mi cuenta
          </h1>
        </div>

        {msg && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium animate-fade-in">
            {msg}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-rose-100 shadow-elegant p-6 mb-4">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {customer.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-serif text-xl font-bold text-rose-900 truncate">{customer.full_name}</p>
              {customer.dni && <p className="text-sm text-stone-500">DNI {customer.dni}</p>}
            </div>
          </div>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">Nombre completo</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-4 py-3 bg-rose-50/30 border border-rose-100 rounded-xl text-stone-900 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">WhatsApp</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-3 bg-rose-50/30 border border-rose-100 rounded-xl text-stone-900 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setEditing(false); setForm({ full_name: customer.full_name, phone: customer.phone || '' }); }}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl font-semibold text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-rose-50">
                <span className="text-sm text-stone-500">WhatsApp</span>
                <span className="text-sm font-medium text-stone-900">{customer.phone || '—'}</span>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 py-2.5 rounded-xl font-semibold text-sm"
              >
                Editar mis datos
              </button>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <Link
            href="/mis-pedidos"
            className="block bg-white rounded-2xl border border-rose-100 shadow-elegant p-5 hover:border-rose-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-rose-700 font-bold tracking-widest uppercase mb-1">Boutique</p>
                <p className="font-serif text-lg font-bold text-rose-900">Mis pedidos</p>
                <p className="text-sm text-stone-500">
                  {loading ? 'Cargando…' : `${orderCount} ${orderCount === 1 ? 'pedido' : 'pedidos'}`}
                </p>
              </div>
              <span className="text-rose-400 text-xl">→</span>
            </div>
          </Link>

          <Link
            href="/mis-reparaciones"
            className="block bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl border border-amber-500/30 shadow-elegant p-5 hover:border-amber-500/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-amber-400 font-bold tracking-widest uppercase mb-1">CLOUD</p>
                <p className="font-bold text-white text-lg">Mis reparaciones</p>
                <p className="text-sm text-zinc-400">
                  {loading ? 'Cargando…' : `${ticketCount} ${ticketCount === 1 ? 'ticket' : 'tickets'}`}
                </p>
              </div>
              <span className="text-amber-400 text-xl">→</span>
            </div>
          </Link>
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 py-3 rounded-xl font-semibold"
        >
          Cerrar sesión
        </button>
      </main>

      <Footer />
    </>
  );
}
