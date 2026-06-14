'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/lib/store';

interface Ticket {
  id: string;
  ticket_code: string;
  brand_name: string;
  model_name: string;
  service_type: string;
  variant_label: string;
  agreed_price: number;
  estimated_time?: string;
  warranty?: string;
  status: string;
  customer_notes?: string;
  received_at?: string;
  diagnosed_at?: string;
  quoted_at?: string;
  approved_at?: string;
  repair_start_at?: string;
  ready_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  created_at: string;
}

interface HistoryEntry {
  id: string;
  from_status?: string;
  to_status: string;
  notes?: string;
  changed_at: string;
}

const STATUS_MAP: Record<string, { label: string; description: string; color: string; dot: string }> = {
  received:    { label: 'Recibido',     description: 'Recibimos tu solicitud, vamos a evaluarlo',  color: 'bg-zinc-700 text-zinc-200 border-zinc-600',     dot: 'bg-zinc-400' },
  diagnosing:  { label: 'En diagnóstico', description: 'Estamos revisando el equipo',                color: 'bg-blue-500/10 text-blue-300 border-blue-500/30', dot: 'bg-blue-400' },
  quoted:      { label: 'Presupuestado', description: 'Tenemos el presupuesto, esperamos confirmación', color: 'bg-amber-500/10 text-amber-300 border-amber-500/30', dot: 'bg-amber-400' },
  approved:    { label: 'Aprobado',     description: 'Aprobaste el presupuesto, pasa a reparación',  color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' },
  in_repair:   { label: 'En reparación', description: 'Estamos trabajando en tu equipo',             color: 'bg-purple-500/10 text-purple-300 border-purple-500/30', dot: 'bg-purple-400' },
  ready:       { label: 'Listo para retirar', description: 'Tu equipo está listo, pasá a buscarlo',  color: 'bg-emerald-500 text-black border-emerald-400',  dot: 'bg-emerald-400' },
  delivered:   { label: 'Entregado',    description: 'Tu equipo fue entregado',                       color: 'bg-zinc-800 text-zinc-400 border-zinc-700',     dot: 'bg-zinc-500' },
  cancelled:   { label: 'Cancelado',    description: 'Esta reparación fue cancelada',                 color: 'bg-rose-500/10 text-rose-300 border-rose-500/30', dot: 'bg-rose-400' },
};

const PIPELINE_ORDER = ['received', 'diagnosing', 'quoted', 'approved', 'in_repair', 'ready', 'delivered'];

export default function MisReparacionesPage() {
  const router = useRouter();
  const { customer } = useCartStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (!customer) {
      router.push('/login?redirect=/mis-reparaciones');
      return;
    }
    loadTickets();
  }, [customer]);

  const loadTickets = async () => {
    if (!customer) return;
    setLoading(true);
    const filter = customer.dni
      ? `customer_id.eq.${customer.id},customer_dni.eq.${customer.dni}`
      : `customer_id.eq.${customer.id}`;
    const { data } = await supabase
      .from('repair_tickets')
      .select('*')
      .or(filter)
      .order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };

  const openTicket = async (t: Ticket) => {
    setSelected(t);
    const { data } = await supabase
      .from('repair_ticket_history')
      .select('*')
      .eq('ticket_id', t.id)
      .order('changed_at', { ascending: true });
    setHistory(data || []);
  };

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="bg-zinc-900/70 backdrop-blur border-b border-amber-500/20 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-amber-400 rounded-lg flex items-center justify-center text-black font-black text-lg">C</div>
            <div>
              <p className="font-bold text-white leading-tight">CLOUD</p>
              <p className="text-[10px] text-amber-400 tracking-widest font-bold uppercase">Mis reparaciones</p>
            </div>
          </Link>
          <Link href="/servicio-tecnico" className="text-xs bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg font-semibold">
            + Nueva
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl h-24 animate-pulse" />)}
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-zinc-900 border border-dashed border-zinc-700 rounded-2xl p-10 text-center">
            <p className="font-bold text-zinc-300">Aún no tenés reparaciones</p>
            <p className="text-sm text-zinc-500 mt-1 mb-5">Cuando solicites una vas a verla acá con su estado en tiempo real.</p>
            <Link href="/servicio-tecnico" className="inline-block bg-amber-400 hover:bg-amber-300 text-black px-5 py-2.5 rounded-xl font-bold text-sm">
              Solicitar reparación
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map(t => {
              const st = STATUS_MAP[t.status] || STATUS_MAP.received;
              return (
                <button key={t.id} onClick={() => openTicket(t)}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/40 rounded-2xl p-4 text-left transition-all">
                  <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-amber-400 font-bold text-sm">{t.ticket_code}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${st.color} inline-flex items-center gap-1.5`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
                          {st.label}
                        </span>
                      </div>
                      <p className="font-bold text-white mt-1">{t.brand_name} {t.model_name}</p>
                      <p className="text-xs text-zinc-400">{t.service_type} · {t.variant_label}</p>
                    </div>
                    <p className="text-xl font-bold text-amber-400 flex-shrink-0">
                      ${Number(t.agreed_price).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    {new Date(t.created_at).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {selected && (
        <TicketDetailModal
          ticket={selected}
          history={history}
          onClose={() => { setSelected(null); setHistory([]); }}
        />
      )}
    </div>
  );
}

function TicketDetailModal({ ticket, history, onClose }: { ticket: Ticket; history: HistoryEntry[]; onClose: () => void }) {
  const st = STATUS_MAP[ticket.status] || STATUS_MAP.received;
  const currentIdx = PIPELINE_ORDER.indexOf(ticket.status);
  const isCancelled = ticket.status === 'cancelled';

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-t-2xl sm:rounded-2xl max-w-lg w-full max-h-[92vh] overflow-hidden flex flex-col">

        <div className="p-5 border-b border-zinc-800 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Ticket</p>
            <p className="font-mono font-bold text-amber-400 text-lg">{ticket.ticket_code}</p>
            <span className={`mt-2 inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-bold border ${st.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
              {st.label}
            </span>
            <p className="text-xs text-zinc-400 mt-2">{st.description}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-zinc-800 hover:bg-zinc-700 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Datos del equipo */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-3">Datos de la reparación</p>
            <div className="space-y-2">
              <SummaryRow label="Equipo" value={`${ticket.brand_name} ${ticket.model_name}`} />
              <SummaryRow label="Servicio" value={ticket.service_type} />
              <SummaryRow label="Calidad" value={ticket.variant_label} />
              {ticket.warranty && <SummaryRow label="Garantía" value={ticket.warranty} />}
              <SummaryRow label="Precio" value={`$${Number(ticket.agreed_price).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} highlight />
            </div>
          </div>

          {/* Pipeline visual */}
          {!isCancelled && (
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-3">Estado de la reparación</p>
              <div className="space-y-2">
                {PIPELINE_ORDER.slice(0, -1).map((stKey, idx) => {
                  const stInfo = STATUS_MAP[stKey];
                  const isPast = idx < currentIdx;
                  const isCurrent = idx === currentIdx;
                  const dotColor = isPast ? 'bg-emerald-400' : isCurrent ? stInfo.dot : 'bg-zinc-700';
                  return (
                    <div key={stKey} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${dotColor} ${isCurrent ? 'ring-4 ring-amber-500/20' : ''}`}></div>
                      <p className={`text-sm ${isCurrent ? 'text-white font-bold' : isPast ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        {stInfo.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notas del cliente */}
          {ticket.customer_notes && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Tus notas</p>
              <p className="text-sm text-zinc-300">{ticket.customer_notes}</p>
            </div>
          )}

          {/* Historial */}
          {history.length > 0 && (
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-3">Historial</p>
              <div className="space-y-2">
                {history.map(h => {
                  const stInfo = STATUS_MAP[h.to_status] || { label: h.to_status, color: '', dot: 'bg-zinc-500' };
                  return (
                    <div key={h.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full ${stInfo.dot} mt-1.5 flex-shrink-0`}></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white">{stInfo.label}</p>
                        {h.notes && <p className="text-xs text-zinc-400 mt-0.5">{h.notes}</p>}
                        <p className="text-[10px] text-zinc-600 mt-1">
                          {new Date(h.changed_at).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-zinc-500 text-xs uppercase tracking-wider font-bold">{label}</span>
      <span className={`font-semibold text-right ${highlight ? 'text-amber-400 text-lg' : 'text-white'}`}>{value}</span>
    </div>
  );
}
