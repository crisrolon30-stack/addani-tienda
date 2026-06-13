// app/ticket/[code]/page.tsx
// Página pública del ticket - el cliente la abre por link de WhatsApp

import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type PageProps = { params: Promise<{ code: string }> };

const STATUS_INFO: Record<string, { label: string; color: string; icon: string; description: string }> = {
  received: { label: 'Recibido', color: 'blue', icon: '📥', description: 'Tu equipo fue ingresado al taller' },
  diagnosing: { label: 'En diagnóstico', color: 'purple', icon: '🔍', description: 'Estamos revisando tu equipo' },
  quoted: { label: 'Presupuestado', color: 'amber', icon: '💵', description: 'Te enviamos el presupuesto' },
  approved: { label: 'Aprobado', color: 'cyan', icon: '✅', description: 'Iniciamos la reparación' },
  in_repair: { label: 'En reparación', color: 'orange', icon: '🔧', description: 'Estamos reparando tu equipo' },
  waiting_parts: { label: 'Esperando repuesto', color: 'yellow', icon: '⏳', description: 'Esperamos un repuesto específico' },
  ready: { label: 'Listo para retirar', color: 'emerald', icon: '🎉', description: 'Tu equipo está listo!' },
  delivered: { label: 'Entregado', color: 'green', icon: '📦', description: 'Equipo entregado al cliente' },
  not_repaired: { label: 'No reparado', color: 'stone', icon: '❌', description: 'No fue posible reparar' },
  cancelled: { label: 'Cancelado', color: 'rose', icon: '🚫', description: 'Solicitud cancelada' },
};

const COLOR_CLASSES: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-900 border-blue-300',
  purple: 'bg-purple-50 text-purple-900 border-purple-300',
  amber: 'bg-amber-50 text-amber-900 border-amber-300',
  cyan: 'bg-cyan-50 text-cyan-900 border-cyan-300',
  orange: 'bg-orange-50 text-orange-900 border-orange-300',
  yellow: 'bg-yellow-50 text-yellow-900 border-yellow-300',
  emerald: 'bg-emerald-50 text-emerald-900 border-emerald-300',
  green: 'bg-green-50 text-green-900 border-green-300',
  stone: 'bg-stone-100 text-stone-700 border-stone-300',
  rose: 'bg-rose-50 text-rose-900 border-rose-300',
};

export default async function TicketPublicPage({ params }: PageProps) {
  const { code } = await params;
  const upperCode = code.toUpperCase();

  // Buscar primero en repair_tickets, luego en repair_requests
  const { data: ticket } = await supabase
    .from('repair_tickets')
    .select('*')
    .eq('ticket_code', upperCode)
    .maybeSingle();

  if (!ticket) {
    const { data: request } = await supabase
      .from('repair_requests')
      .select('*')
      .eq('ticket_code', upperCode)
      .maybeSingle();

    if (!request) notFound();

    return <RequestView request={request} />;
  }

  return <TicketView ticket={ticket} />;
}

function TicketView({ ticket }: { ticket: any }) {
  const st = STATUS_INFO[ticket.status] || STATUS_INFO.received;
  const statusClass = COLOR_CLASSES[st.color] || COLOR_CLASSES.blue;
  const saldo = Math.max((ticket.agreed_price || 0) - (ticket.total_paid || 0), 0);
  const fmt = (n: number) => `$${(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
  const fechaIngreso = new Date(ticket.received_at).toLocaleString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-[#fdfaf6] py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Encabezado ADDANI */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-rose-900 text-amber-300 rounded-2xl mb-3">
            <span className="font-serif text-3xl font-bold">A</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-rose-950">ADDANI</h1>
          <p className="font-display italic text-stone-600 text-sm tracking-widest uppercase">Servicio Técnico</p>
        </div>

        {/* Card principal del ticket */}
        <div className="bg-white rounded-2xl shadow-elegant-lg overflow-hidden border border-stone-200">

          {/* Header con código */}
          <div className="bg-gradient-to-r from-rose-950 to-rose-900 text-white p-5 text-center">
            <p className="font-display italic text-amber-300 text-xs tracking-[0.3em] uppercase mb-1">Tu orden de servicio</p>
            <p className="font-mono font-bold text-2xl tracking-wider">{ticket.ticket_code}</p>
            <p className="text-rose-200 text-xs mt-1">{fechaIngreso}</p>
          </div>

          {/* Estado actual */}
          <div className={`${statusClass} border-b-4 p-5 text-center`}>
            <div className="text-4xl mb-2">{st.icon}</div>
            <p className="font-display italic text-xs tracking-[0.3em] uppercase mb-1 opacity-80">Estado actual</p>
            <p className="font-serif text-xl font-bold">{st.label}</p>
            <p className="text-sm mt-1 opacity-80">{st.description}</p>
          </div>

          {/* Datos del equipo y cliente */}
          <div className="p-5 space-y-4">
            <section>
              <p className="font-display italic text-rose-800 text-[10px] tracking-[0.3em] uppercase mb-2">Cliente</p>
              <p className="font-serif text-lg text-stone-900">{ticket.customer_name}</p>
              {ticket.customer_phone && <p className="text-sm text-stone-500">{ticket.customer_phone}</p>}
            </section>

            <hr className="border-stone-200" />

            <section>
              <p className="font-display italic text-rose-800 text-[10px] tracking-[0.3em] uppercase mb-2">Equipo</p>
              <p className="font-serif text-lg text-stone-900">{ticket.brand_name} {ticket.model_name}</p>
              {ticket.imei && <p className="text-xs text-stone-500 font-mono">IMEI: {ticket.imei}</p>}
              {ticket.device_color && <p className="text-xs text-stone-500">Color: {ticket.device_color}</p>}
            </section>

            <hr className="border-stone-200" />

            <section>
              <p className="font-display italic text-rose-800 text-[10px] tracking-[0.3em] uppercase mb-2">Servicio</p>
              <p className="font-serif text-base text-stone-900">{ticket.service_type}</p>
              {ticket.variant_label && (
                <p className="text-sm text-stone-600">{ticket.variant_label}</p>
              )}
              {ticket.fault_description && (
                <p className="text-xs text-stone-500 mt-1 italic">"{ticket.fault_description}"</p>
              )}
            </section>

            <hr className="border-stone-200" />

            {/* Resumen económico */}
            <section className="bg-gradient-to-br from-rose-50 to-amber-50 -mx-5 px-5 py-4 border-y border-rose-100">
              <p className="font-display italic text-rose-800 text-[10px] tracking-[0.3em] uppercase mb-3">Resumen económico</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span className="font-medium">{fmt(ticket.agreed_price || 0)}</span>
                </div>
                {(ticket.total_paid || 0) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Pagado</span>
                    <span className="font-medium">- {fmt(ticket.total_paid)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-rose-200 font-serif text-lg">
                  <span className="text-stone-900">{saldo > 0 ? 'Saldo pendiente' : 'Total'}</span>
                  <span className="font-bold text-rose-900">{fmt(saldo > 0 ? saldo : ticket.agreed_price || 0)}</span>
                </div>
              </div>
            </section>

            {ticket.warranty && (
              <div className="text-center bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="font-display italic text-amber-800 text-[10px] tracking-[0.3em] uppercase">Garantía</p>
                <p className="font-serif text-amber-900 font-bold mt-0.5">{ticket.warranty}</p>
              </div>
            )}
          </div>
        </div>

        {/* CTA WhatsApp + Imprimir */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <a href="https://wa.me/5493624522965"
            target="_blank" rel="noopener"
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-sm font-medium text-sm tracking-wide uppercase transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654z"/>
            </svg>
            <span>Consultar</span>
          </a>
          <Link href="/servicio-tecnico"
            className="flex items-center justify-center gap-2 bg-white hover:bg-rose-50 text-rose-900 border border-rose-200 py-3 rounded-sm font-medium text-sm tracking-wide uppercase transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
            <span>Otra cotización</span>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-stone-500 font-sans">
          <p>ADDANI · Resistencia, Chaco · Servicio Técnico</p>
          <p className="mt-1">Guardá este link para hacer seguimiento de tu reparación.</p>
        </div>
      </div>
    </div>
  );
}

function RequestView({ request }: { request: any }) {
  const fmt = (n: number) => `$${(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
  const fecha = new Date(request.created_at).toLocaleString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const status = request.status === 'pending' ? { label: 'Pendiente de revisión', color: 'amber', icon: '⏳', desc: 'Estamos revisando tu solicitud' }
    : request.status === 'accepted' ? { label: 'Aceptada', color: 'emerald', icon: '✅', desc: 'Tu solicitud fue aceptada' }
    : request.status === 'completed' ? { label: 'Completada', color: 'green', icon: '🎉', desc: 'Reparación finalizada' }
    : { label: 'Cancelada', color: 'rose', icon: '🚫', desc: 'Solicitud cancelada' };

  const statusClass = COLOR_CLASSES[status.color] || COLOR_CLASSES.amber;

  return (
    <div className="min-h-screen bg-[#fdfaf6] py-8 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-rose-900 text-amber-300 rounded-2xl mb-3">
            <span className="font-serif text-3xl font-bold">A</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-rose-950">ADDANI</h1>
          <p className="font-display italic text-stone-600 text-sm tracking-widest uppercase">Servicio Técnico</p>
        </div>

        <div className="bg-white rounded-2xl shadow-elegant-lg overflow-hidden border border-stone-200">
          <div className="bg-gradient-to-r from-rose-950 to-rose-900 text-white p-5 text-center">
            <p className="font-display italic text-amber-300 text-xs tracking-[0.3em] uppercase mb-1">Solicitud de cotización</p>
            <p className="font-mono font-bold text-2xl tracking-wider">{request.ticket_code}</p>
            <p className="text-rose-200 text-xs mt-1">{fecha}</p>
          </div>

          <div className={`${statusClass} border-b-4 p-5 text-center`}>
            <div className="text-4xl mb-2">{status.icon}</div>
            <p className="font-serif text-xl font-bold">{status.label}</p>
            <p className="text-sm mt-1 opacity-80">{status.desc}</p>
          </div>

          <div className="p-5 space-y-4">
            <section>
              <p className="font-display italic text-rose-800 text-[10px] tracking-[0.3em] uppercase mb-2">Cliente</p>
              <p className="font-serif text-lg text-stone-900">{request.customer_name || 'Cliente'}</p>
              {request.customer_phone && <p className="text-sm text-stone-500">{request.customer_phone}</p>}
            </section>

            <hr className="border-stone-200" />

            <section>
              <p className="font-display italic text-rose-800 text-[10px] tracking-[0.3em] uppercase mb-2">Equipo y servicio</p>
              <p className="font-serif text-lg text-stone-900">{request.brand_name} {request.model_name}</p>
              <p className="text-sm text-stone-700">{request.service_type}</p>
              {request.variant_label && <p className="text-xs text-stone-500">{request.variant_label}</p>}
            </section>

            <section className="bg-gradient-to-br from-rose-50 to-amber-50 -mx-5 px-5 py-4 border-y border-rose-100 text-center">
              <p className="font-display italic text-rose-800 text-[10px] tracking-[0.3em] uppercase mb-2">Precio cotizado</p>
              <p className="font-serif text-3xl font-bold text-rose-900">{fmt(request.final_price || 0)}</p>
            </section>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <a href="https://wa.me/5493624522965"
            target="_blank" rel="noopener"
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-sm font-medium text-sm tracking-wide uppercase">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654z"/>
            </svg>
            <span>Consultar</span>
          </a>
          <Link href="/servicio-tecnico"
            className="flex items-center justify-center gap-2 bg-white hover:bg-rose-50 text-rose-900 border border-rose-200 py-3 rounded-sm font-medium text-sm tracking-wide uppercase">
            <span>Nueva cotización</span>
          </Link>
        </div>

        <div className="text-center mt-6 text-xs text-stone-500">
          <p>ADDANI · Resistencia, Chaco</p>
          <p className="mt-1">Guardá este link para consultar tu solicitud.</p>
        </div>
      </div>
    </div>
  );
}
