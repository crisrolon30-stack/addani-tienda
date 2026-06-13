'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/lib/store';

interface Brand { id: string; name: string; logo_url?: string; }
interface Model { id: string; brand_id: string; name: string; image_url?: string; }
interface Service { id: string; model_id: string; service_type: string; description?: string; estimated_time?: string; warranty?: string; }
interface Variant { id: string; service_id: string; label: string; cost_price: number; markup_percent: number; }
interface Advantage { icon: string; title: string; description: string; }
interface Testimonial { name: string; text: string; rating: number; date?: string; }
interface FAQ { question: string; answer: string; }
interface Config {
  whatsapp_number?: string;
  hero_title?: string;
  hero_subtitle?: string;
  business_address?: string;
  business_hours?: string;
  local_image_url?: string;
  map_embed_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  rating_overall?: number;
  rating_count?: number;
  years_experience?: number;
  repairs_count?: number;
  advantages?: Advantage[];
  testimonials?: Testimonial[];
  faqs?: FAQ[];
  gallery_images?: string[];
}

type Step = 'brand' | 'model' | 'service' | 'variant' | 'summary' | 'done';

export default function ServicioTecnicoPage() {
  const router = useRouter();
  const { customer } = useCartStore();

  const [step, setStep] = useState<Step | 'landing'>('landing');
  const [loading, setLoading] = useState(true);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [config, setConfig] = useState<Config>({});

  const [brand, setBrand] = useState<Brand | null>(null);
  const [model, setModel] = useState<Model | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [variant, setVariant] = useState<Variant | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [ticketCode, setTicketCode] = useState('');

  useEffect(() => { loadAll(); }, []);
  useEffect(() => {
    if (customer) {
      setCustomerName(customer.full_name || '');
      setCustomerPhone(customer.phone || '');
    }
  }, [customer]);

  const loadAll = async () => {
    setLoading(true);
    const [b, m, s, v, c] = await Promise.all([
      supabase.from('repair_brands').select('*').eq('active', true).order('display_order'),
      supabase.from('repair_models').select('*').eq('active', true).order('display_order'),
      supabase.from('repair_services').select('*').eq('active', true).order('display_order'),
      supabase.from('repair_variants').select('*').eq('active', true).order('display_order'),
      supabase.from('repair_config').select('*').limit(1).maybeSingle(),
    ]);
    setBrands(b.data || []);
    setModels(m.data || []);
    setServices(s.data || []);
    setVariants(v.data || []);
    setConfig(c.data || {});
    setLoading(false);
  };

  const brandModels = brand ? models.filter(m => m.brand_id === brand.id) : [];
  const modelServices = model ? services.filter(s => s.model_id === model.id) : [];
  const serviceVariants = service ? variants.filter(v => v.service_id === service.id) : [];
  const finalPrice = variant ? variant.cost_price * (1 + variant.markup_percent / 100) : 0;

  const startCotizar = () => {
    setBrand(null); setModel(null); setService(null); setVariant(null); setTicketCode('');
    setStep('brand');
    setTimeout(() => {
      document.getElementById('cotizar-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const pickBrand = (b: Brand) => { setBrand(b); setModel(null); setService(null); setVariant(null); setStep('model'); };
  const pickModel = (m: Model) => { setModel(m); setService(null); setVariant(null); setStep('service'); };
  const pickService = (s: Service) => {
    setService(s);
    const sv = variants.filter(v => v.service_id === s.id);
    setVariant(null);
    if (sv.length === 1) { setVariant(sv[0]); setStep('summary'); }
    else setStep('variant');
  };
  const pickVariant = (v: Variant) => { setVariant(v); setStep('summary'); };

  const goBack = () => {
    if (step === 'brand') { setStep('landing'); }
    else if (step === 'model') { setStep('brand'); setBrand(null); }
    else if (step === 'service') { setStep('model'); setModel(null); }
    else if (step === 'variant') { setStep('service'); setService(null); }
    else if (step === 'summary') {
      const sv = service ? variants.filter(v => v.service_id === service.id) : [];
      if (sv.length === 1) { setStep('service'); setService(null); setVariant(null); }
      else { setStep('variant'); setVariant(null); }
    }
  };

  const submitTicket = async () => {
    if (!brand || !model || !service || !variant) return;
    setConfirming(true);

    const chars = 'ACDEFGHJKLMNPQRSTUVWXYZ23456789';
    const genCode = () => {
      let c = '';
      for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
      return 'TK-' + c;
    };

    // intentar hasta 5 veces si el código se repite
    let ticket: any = null;
    let lastError: any = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const ticket_code = genCode();
      const { data, error } = await supabase.from('repair_tickets').insert({
        ticket_code,
        customer_id: customer?.id || null,
        customer_name: customerName.trim() || customer?.full_name || 'Sin nombre',
        customer_phone: (customerPhone || customer?.phone || '').replace(/\D/g, ''),
        customer_dni: customer?.dni || null,
        brand_name: brand.name,
        model_name: model.name,
        service_type: service.service_type,
        variant_label: variant.label,
        agreed_price: finalPrice,
        estimated_time: service.estimated_time,
        warranty: service.warranty,
        customer_notes: notes || null,
        source: 'web',
        status: 'received',
      }).select().single();

      if (data) { ticket = data; break; }
      lastError = error;
      // si es error de unique constraint, reintenta. Si es otro tipo, frena.
      if (!error?.message?.toLowerCase().includes('duplicate') && !error?.message?.toLowerCase().includes('unique')) break;
    }

    if (!ticket) {
      alert('Error al crear el ticket: ' + (lastError?.message || 'desconocido'));
      setConfirming(false);
      return;
    }

    await supabase.from('repair_ticket_history').insert({
      ticket_id: ticket.id,
      from_status: null,
      to_status: 'received',
      notes: 'Ticket creado desde la web',
    });

    setTicketCode(ticket.ticket_code);

    const phone = (config.whatsapp_number || '5493624522965').replace(/\D/g, '');
    const msg = [
      `Hola CLOUD! Solicito reparación:`,
      ``,
      `*Ticket:* ${ticket.ticket_code}`,
      `*Cliente:* ${customerName.trim() || customer?.full_name || ''}`,
      `*Equipo:* ${brand.name} ${model.name}`,
      `*Servicio:* ${service.service_type} (${variant.label})`,
      `*Precio:* $${finalPrice.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`,
      service.estimated_time ? `*Demora:* ${service.estimated_time}` : '',
      service.warranty ? `*Garantía:* ${service.warranty}` : '',
      notes ? `\n*Notas:* ${notes}` : '',
    ].filter(Boolean).join('\n');

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    setConfirming(false);
    setStep('done');
    setTimeout(() => document.getElementById('cotizar-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full h-9 w-9 border-2 border-zinc-700 border-t-amber-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <RepairHeader customer={customer} />

      {/* ═══ HERO ═══ */}
      <Hero config={config} onStart={startCotizar} hasBrands={brands.length > 0} />

      {/* ═══ COTIZADOR (sticky cuando está activo) ═══ */}
      <div id="cotizar-section" className="scroll-mt-20">
        {step !== 'landing' && (
          <section className="bg-gradient-to-b from-amber-500/5 via-zinc-950 to-zinc-950 border-y border-amber-500/20 py-10">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
              {step !== 'done' && <Progress step={step} />}
              {step !== 'done' && (
                <button onClick={goBack}
                  className="flex items-center gap-1.5 text-amber-400 text-sm font-bold mb-4 hover:text-amber-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                  {step === 'brand' ? 'Cerrar cotizador' : 'Volver'}
                </button>
              )}

              {step === 'brand' && (
                <Section title="Elegí tu marca">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {brands.map(b => (
                      <button key={b.id} onClick={() => pickBrand(b)}
                        className="group bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 rounded-2xl p-5 transition-all hover:-translate-y-0.5">
                        {b.logo_url ? (
                          <img src={b.logo_url} alt={b.name} className="w-16 h-16 mx-auto rounded-lg object-cover mb-3" />
                        ) : (
                          <div className="w-16 h-16 mx-auto bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center text-amber-400 font-black text-2xl mb-3 group-hover:scale-110 transition-transform">
                            {b.name.charAt(0)}
                          </div>
                        )}
                        <p className="font-bold text-center">{b.name}</p>
                      </button>
                    ))}
                  </div>
                </Section>
              )}

              {step === 'model' && brand && (
                <Section title={`Elegí tu ${brand.name}`}>
                  {brandModels.length === 0 ? (
                    <Empty msg="Todavía no cargamos modelos de esta marca. Contactanos por WhatsApp." />
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {brandModels.map(m => (
                        <button key={m.id} onClick={() => pickModel(m)}
                          className="group bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 rounded-2xl p-4 transition-all text-left hover:-translate-y-0.5">
                          {m.image_url ? (
                            <img src={m.image_url} alt={m.name} className="w-full aspect-square rounded-lg object-cover mb-3" />
                          ) : (
                            <div className="w-full aspect-square bg-zinc-800 rounded-lg flex items-center justify-center mb-3 group-hover:bg-zinc-700 transition-colors">
                              <PhoneIcon className="w-10 h-10 text-zinc-600 group-hover:text-amber-400 transition-colors" />
                            </div>
                          )}
                          <p className="font-bold text-sm">{m.name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </Section>
              )}

              {step === 'service' && model && (
                <Section title={`¿Qué le pasa a tu ${model.name}?`}>
                  {modelServices.length === 0 ? (
                    <Empty msg="No hay servicios disponibles para este modelo. Contactanos por WhatsApp." />
                  ) : (
                    <div className="space-y-2">
                      {modelServices.map(s => {
                        const vs = variants.filter(v => v.service_id === s.id);
                        const minPrice = vs.length > 0 ? Math.min(...vs.map(v => v.cost_price * (1 + v.markup_percent / 100))) : 0;
                        return (
                          <button key={s.id} onClick={() => pickService(s)}
                            className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 rounded-2xl p-4 text-left transition-all">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="font-bold">{s.service_type}</p>
                                {s.description && <p className="text-xs text-zinc-500 mt-0.5">{s.description}</p>}
                                <div className="flex gap-3 mt-2 text-[11px] text-zinc-500 flex-wrap">
                                  {s.estimated_time && <span className="inline-flex items-center gap-1"><ClockIcon className="w-3 h-3" /> {s.estimated_time}</span>}
                                  {s.warranty && <span className="inline-flex items-center gap-1"><ShieldIcon className="w-3 h-3" /> {s.warranty}</span>}
                                </div>
                              </div>
                              {minPrice > 0 && (
                                <div className="text-right flex-shrink-0">
                                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Desde</p>
                                  <p className="font-bold text-amber-400 text-lg">${minPrice.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </Section>
              )}

              {step === 'variant' && service && (
                <Section title="Elegí la calidad del repuesto">
                  <div className="space-y-2">
                    {serviceVariants.map(v => {
                      const price = v.cost_price * (1 + v.markup_percent / 100);
                      return (
                        <button key={v.id} onClick={() => pickVariant(v)}
                          className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 rounded-2xl p-4 text-left transition-all flex items-center justify-between gap-3">
                          <p className="font-bold">{v.label}</p>
                          <p className="text-2xl font-bold text-amber-400">${price.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                        </button>
                      );
                    })}
                  </div>
                </Section>
              )}

              {step === 'summary' && brand && model && service && variant && (
                <Section title="Confirmá tu solicitud">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-5 space-y-3">
                      <SummaryRow label="Equipo" value={`${brand.name} ${model.name}`} />
                      <SummaryRow label="Servicio" value={service.service_type} />
                      <SummaryRow label="Calidad" value={variant.label} />
                      {service.estimated_time && <SummaryRow label="Demora estimada" value={service.estimated_time} />}
                      {service.warranty && <SummaryRow label="Garantía" value={service.warranty} />}
                    </div>
                    <div className="bg-amber-500/10 border-t border-amber-500/20 p-5 flex items-center justify-between">
                      <span className="text-amber-300 font-bold uppercase text-xs tracking-wider">Total</span>
                      <span className="text-3xl font-bold text-amber-400">${finalPrice.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>

                  {!customer && (
                    <div className="mt-4 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                      <p className="text-xs text-amber-300">
                        <strong>Iniciá sesión</strong> para guardar el ticket y hacer seguimiento.{' '}
                        <Link href="/login?redirect=/servicio-tecnico" className="underline">Ingresar</Link>
                      </p>
                    </div>
                  )}

                  <div className="mt-4 space-y-3">
                    {!customer && (
                      <>
                        <Field label="Tu nombre" value={customerName} onChange={setCustomerName} placeholder="Nombre y apellido" />
                        <Field label="WhatsApp" value={customerPhone} onChange={setCustomerPhone} placeholder="Ej: 3624000000" inputMode="numeric" />
                      </>
                    )}
                    <Field label="Notas (opcional)" value={notes} onChange={setNotes} placeholder="¿Algo más que tengamos que saber?" textarea />
                  </div>

                  <button onClick={submitTicket} disabled={confirming || (!customer && (!customerName.trim() || !customerPhone.trim()))}
                    className="mt-5 w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black py-4 rounded-xl font-bold transition-colors">
                    {confirming ? 'Generando ticket…' : 'Confirmar y enviar por WhatsApp'}
                  </button>

                  <p className="mt-3 text-center text-xs text-zinc-500">
                    Te abriremos WhatsApp con el resumen y tu número de ticket.
                  </p>
                </Section>
              )}

              {step === 'done' && (
                <div className="bg-gradient-to-br from-amber-500/10 to-zinc-900 border border-amber-500/30 rounded-3xl p-8 text-center">
                  <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">¡Solicitud enviada!</h2>
                  <p className="text-zinc-400 text-sm mb-4">Tu ticket fue generado y enviado por WhatsApp.</p>
                  <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 mb-5 inline-block">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Tu número de ticket</p>
                    <p className="text-3xl font-bold text-amber-400 font-mono">{ticketCode}</p>
                  </div>
                  <p className="text-xs text-zinc-500 mb-5">Guardá este código. Vas a poder ver el estado de tu reparación cuando quieras.</p>

                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    {customer && (
                      <Link href="/mis-reparaciones"
                        className="bg-amber-400 hover:bg-amber-300 text-black px-5 py-3 rounded-xl font-bold text-sm">
                        Ver mis reparaciones
                      </Link>
                    )}
                    <button onClick={startCotizar}
                      className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white px-5 py-3 rounded-xl font-semibold text-sm">
                      Hacer otra solicitud
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* ═══ MARCAS ═══ */}
      {brands.length > 0 && step === 'landing' && (
        <BrandsStrip brands={brands} onClick={(b) => {
          pickBrand(b);
          setTimeout(() => {
            document.getElementById('cotizar-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 50);
        }} />
      )}

      {/* ═══ VENTAJAS ═══ */}
      {(config.advantages?.length || 0) > 0 && <Advantages items={config.advantages || []} />}

      {/* ═══ GALERIA ═══ */}
      {(config.gallery_images?.length || 0) > 0 && <Gallery images={config.gallery_images || []} />}

      {/* ═══ TESTIMONIOS ═══ */}
      {(config.testimonials?.length || 0) > 0 && <Testimonials items={config.testimonials || []} />}

      {/* ═══ FAQS ═══ */}
      {(config.faqs?.length || 0) > 0 && <FAQs items={config.faqs || []} />}

      {/* ═══ CTA FINAL ═══ */}
      <CTASection config={config} onStart={startCotizar} hasBrands={brands.length > 0} />

      {/* ═══ FOOTER ═══ */}
      <RepairFooter config={config} />

      {/* Botón flotante de WhatsApp */}
      <a href={`https://wa.me/${(config.whatsapp_number || '5493624522965').replace(/\D/g, '')}`} target="_blank"
        className="fixed bottom-5 right-5 bg-emerald-500 hover:bg-emerald-400 text-white w-14 h-14 rounded-full shadow-2xl shadow-emerald-500/30 flex items-center justify-center transition-transform hover:scale-110 z-30">
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      </a>
    </div>
  );
}

/* ═══════════════════════════ COMPONENTES ═══════════════════════════ */

function Hero({ config, onStart, hasBrands }: { config: Config; onStart: () => void; hasBrands: boolean }) {
  return (
    <section className="relative overflow-hidden">
      {/* Background ornamentado */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.18),transparent_55%),radial-gradient(circle_at_70%_80%,rgba(190,18,60,0.1),transparent_55%)]"></div>

      {/* Patrón decorativo arriba */}
      <svg className="absolute top-6 left-1/2 -translate-x-1/2 text-amber-400/30 w-32 h-4" viewBox="0 0 128 16" fill="none">
        <path d="M0 8 Q 16 0, 32 8 T 64 8 T 96 8 T 128 8" stroke="currentColor" strokeWidth="1" fill="none"/>
      </svg>

      {/* Líneas radiales decorativas */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden lg:block">
        <svg width="500" height="500" viewBox="0 0 500 500" fill="none" className="text-amber-400">
          <circle cx="250" cy="250" r="240" stroke="currentColor" strokeWidth="0.5"/>
          <circle cx="250" cy="250" r="180" stroke="currentColor" strokeWidth="0.5"/>
          <circle cx="250" cy="250" r="120" stroke="currentColor" strokeWidth="0.5"/>
          <circle cx="250" cy="250" r="60" stroke="currentColor" strokeWidth="0.5"/>
        </svg>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            {/* Eyebrow ornamental */}
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-12 bg-amber-400" />
              <p className="font-display italic text-amber-300 text-sm tracking-[0.3em] uppercase">
                Cloud · Servicio técnico
              </p>
            </div>

            {/* Título con tipografías mezcladas */}
            <h1 className="leading-[0.95] tracking-tight">
              <span className="block font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-amber-50">
                Reparación
              </span>
              <span className="block font-display italic text-5xl sm:text-6xl lg:text-7xl font-light text-amber-300 mt-1">
                profesional
              </span>
              <span className="block font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-amber-50 mt-1">
                de celulares.
              </span>
            </h1>

            <p className="font-sans text-amber-100/70 text-lg sm:text-xl mt-8 max-w-xl leading-relaxed text-balance">
              {config.hero_subtitle || (
                <>
                  Cotizá en minutos.
                  <span className="font-display italic text-amber-300"> Diagnóstico sin cargo</span>, garantía escrita y repuestos de calidad.
                </>
              )}
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              {hasBrands && (
                <button onClick={onStart}
                  className="group inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-stone-900 px-8 py-4 rounded-sm font-semibold tracking-wide text-sm uppercase shadow-2xl shadow-amber-500/20 transition-all">
                  <span>Cotizar mi equipo</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              )}
              <a href={`https://wa.me/${(config.whatsapp_number || '5493624522965').replace(/\D/g, '')}`} target="_blank"
                className="group inline-flex items-center gap-2 bg-stone-900/60 hover:bg-stone-800 border border-amber-700/40 text-amber-100 px-8 py-4 rounded-sm font-medium tracking-wide text-sm uppercase transition-all backdrop-blur-sm">
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654z" />
                </svg>
                <span>WhatsApp directo</span>
              </a>
            </div>

            {/* Stats con tipografía editorial */}
            {(config.years_experience || config.repairs_count || config.rating_overall) && (
              <div className="mt-14 grid grid-cols-3 gap-6 max-w-md border-t border-amber-700/30 pt-8">
                {config.years_experience && (
                  <div>
                    <p className="font-serif text-4xl font-bold text-amber-300 leading-none">{config.years_experience}<span className="text-amber-400/60 text-2xl">+</span></p>
                    <p className="font-display italic text-[11px] text-amber-100/60 uppercase tracking-widest mt-1.5">Años</p>
                  </div>
                )}
                {config.repairs_count && (
                  <div>
                    <p className="font-serif text-4xl font-bold text-amber-300 leading-none">{config.repairs_count}<span className="text-amber-400/60 text-2xl">+</span></p>
                    <p className="font-display italic text-[11px] text-amber-100/60 uppercase tracking-widest mt-1.5">Reparaciones</p>
                  </div>
                )}
                {config.rating_overall && (
                  <div>
                    <p className="font-serif text-4xl font-bold text-amber-300 leading-none flex items-baseline gap-1">
                      {config.rating_overall}
                      <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                    </p>
                    <p className="font-display italic text-[11px] text-amber-100/60 uppercase tracking-widest mt-1.5">
                      {config.rating_count ? `${config.rating_count} reseñas` : 'Calificación'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lado derecho: card de marca / imagen del local */}
          {config.local_image_url ? (
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-br from-amber-500/30 to-rose-700/20 rounded-3xl blur-2xl"></div>
              <img src={config.local_image_url} alt="Local"
                className="relative w-full aspect-[4/3] object-cover rounded-2xl border border-amber-500/30 shadow-elegant-xl" />
            </div>
          ) : (
            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 bg-gradient-to-br from-amber-500/20 to-rose-700/10 rounded-3xl blur-2xl opacity-50"></div>
              <div className="relative bg-gradient-to-br from-stone-800/60 to-amber-950/40 backdrop-blur-sm border border-amber-700/30 rounded-2xl p-10 shadow-elegant-xl">
                {/* Composición editorial */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="h-px w-8 bg-amber-400" />
                  <p className="font-display italic text-amber-300 text-xs tracking-[0.3em] uppercase">Compromiso</p>
                </div>
                <h3 className="font-serif text-3xl text-amber-50 leading-tight mb-2">
                  Tu equipo en<br />
                  <span className="font-display italic text-amber-300">manos expertas.</span>
                </h3>
                <p className="font-sans text-amber-100/60 text-sm mb-8 leading-relaxed">
                  Cada reparación pasa por un proceso de inspección, diagnóstico y prueba antes de entregarse.
                </p>

                {/* 3 valores en grid editorial */}
                <div className="grid grid-cols-3 gap-4 border-t border-amber-700/20 pt-6">
                  <ValueMini label="Diagnóstico" icon={
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  } />
                  <ValueMini label="Garantía" icon={
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                  } />
                  <ValueMini label="Calidad" icon={
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068A3.745 3.745 0 0 1 5.636 5.636a3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"/></svg>
                  } />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ValueMini({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 mx-auto rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300 mb-2">
        {icon}
      </div>
      <p className="font-display italic text-amber-100/80 text-xs tracking-wider">{label}</p>
    </div>
  );
}

function BrandsStrip({ brands, onClick }: { brands: Brand[]; onClick: (b: Brand) => void }) {
  return (
    <section className="py-10 border-t border-zinc-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <p className="text-center text-xs text-zinc-500 uppercase tracking-widest font-bold mb-6">
          Reparamos todas las marcas
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
          {brands.map(b => (
            <button key={b.id} onClick={() => onClick(b)}
              className="group bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 rounded-2xl px-4 py-3 transition-all hover:-translate-y-0.5 flex items-center gap-2.5 min-w-[120px]">
              {b.logo_url ? (
                <img src={b.logo_url} alt={b.name} className="w-7 h-7 rounded object-cover" />
              ) : (
                <div className="w-7 h-7 bg-amber-500/10 border border-amber-500/20 rounded flex items-center justify-center text-amber-400 font-black text-sm group-hover:scale-110 transition-transform">
                  {b.name.charAt(0)}
                </div>
              )}
              <span className="font-bold text-sm">{b.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Advantages({ items }: { items: Advantage[] }) {
  return (
    <section className="py-14 sm:py-20 bg-gradient-to-b from-zinc-950 to-zinc-900/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <p className="text-amber-400 text-xs font-bold tracking-widest uppercase mb-2">Por qué CLOUD</p>
          <h2 className="text-3xl sm:text-4xl font-black">Lo que nos hace distintos</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((adv, idx) => (
            <div key={idx} className="group bg-zinc-900/60 border border-zinc-800 hover:border-amber-500/40 rounded-2xl p-5 transition-all hover:-translate-y-0.5">
              <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 transition-transform">
                <AdvantageIcon name={adv.icon} />
              </div>
              <h3 className="font-bold text-base">{adv.title}</h3>
              <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{adv.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Gallery({ images }: { images: string[] }) {
  return (
    <section className="py-14 sm:py-20 border-t border-zinc-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <p className="text-amber-400 text-xs font-bold tracking-widest uppercase mb-2">Trabajos realizados</p>
          <h2 className="text-3xl sm:text-4xl font-black">Resultados que se ven</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.filter(Boolean).map((url, idx) => (
            <div key={idx} className="aspect-square bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden group">
              <img src={url} alt={`Trabajo ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials({ items }: { items: Testimonial[] }) {
  return (
    <section className="py-14 sm:py-20 bg-gradient-to-b from-zinc-900/40 to-zinc-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <p className="text-amber-400 text-xs font-bold tracking-widest uppercase mb-2">Opiniones</p>
          <h2 className="text-3xl sm:text-4xl font-black">Lo que dicen nuestros clientes</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((t, idx) => (
            <div key={idx} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
              <div className="text-amber-400 mb-3">{'★'.repeat(t.rating)}<span className="text-zinc-700">{'★'.repeat(5 - t.rating)}</span></div>
              <p className="text-zinc-300 text-sm leading-relaxed italic">"{t.text}"</p>
              <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-black font-black">
                  {t.name.charAt(0).toUpperCase()}
                </div>
                <p className="font-bold text-sm">{t.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQs({ items }: { items: FAQ[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section className="py-14 sm:py-20 border-t border-zinc-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <p className="text-amber-400 text-xs font-bold tracking-widest uppercase mb-2">Preguntas frecuentes</p>
          <h2 className="text-3xl sm:text-4xl font-black">Resolvé tus dudas</h2>
        </div>
        <div className="space-y-2">
          {items.map((f, idx) => (
            <div key={idx} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
              <button onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-zinc-900 transition-colors">
                <span className="font-bold pr-3">{f.question}</span>
                <svg className={`w-5 h-5 text-amber-400 flex-shrink-0 transition-transform ${openIdx === idx ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {openIdx === idx && (
                <div className="px-4 pb-4 text-zinc-400 text-sm leading-relaxed border-t border-zinc-800 pt-3">
                  {f.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection({ config, onStart, hasBrands }: { config: Config; onStart: () => void; hasBrands: boolean }) {
  const phone = (config.whatsapp_number || '5493624522965').replace(/\D/g, '');
  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-zinc-950 to-rose-500/5"></div>
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
          ¿Listo para que <span className="text-amber-400">repare tu equipo</span>?
        </h2>
        <p className="text-zinc-400 text-lg mt-4 max-w-xl mx-auto">
          Cotizá online en minutos o escribime directo por WhatsApp.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {hasBrands && (
            <button onClick={onStart}
              className="bg-amber-400 hover:bg-amber-300 text-black px-7 py-4 rounded-xl font-bold transition-all hover:-translate-y-0.5 shadow-lg shadow-amber-500/20">
              Cotizar ahora
            </button>
          )}
          <a href={`https://wa.me/${phone}`} target="_blank"
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-7 py-4 rounded-xl font-bold transition-colors">
            Hablar por WhatsApp
          </a>
        </div>

        {(config.business_address || config.business_hours) && (
          <div className="mt-10 grid sm:grid-cols-2 gap-3 max-w-xl mx-auto">
            {config.business_address && (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 text-left">
                <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1">Dirección</p>
                <p className="text-sm">{config.business_address}</p>
              </div>
            )}
            {config.business_hours && (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 text-left">
                <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1">Horarios</p>
                <p className="text-sm">{config.business_hours}</p>
              </div>
            )}
          </div>
        )}

        {config.map_embed_url && (
          <div className="mt-6 rounded-2xl overflow-hidden border border-zinc-800 max-w-3xl mx-auto">
            <iframe src={config.map_embed_url} className="w-full h-64" loading="lazy"></iframe>
          </div>
        )}
      </div>
    </section>
  );
}

function RepairHeader({ customer }: any) {
  return (
    <header className="bg-zinc-900/80 backdrop-blur border-b border-amber-500/20 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-amber-400 rounded-lg flex items-center justify-center text-black font-black text-lg group-hover:scale-105 transition-transform">C</div>
          <div>
            <p className="font-bold text-white leading-tight">CLOUD</p>
            <p className="text-[10px] text-amber-400 tracking-widest font-bold uppercase">Servicio Técnico</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          {customer && (
            <Link href="/mis-reparaciones" className="text-xs text-zinc-300 hover:text-amber-400 font-semibold hidden sm:block">
              Mis reparaciones
            </Link>
          )}
          <Link href="/" className="text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg font-semibold">
            ← Tienda
          </Link>
        </div>
      </div>
    </header>
  );
}

function RepairFooter({ config }: { config: Config }) {
  const phone = (config.whatsapp_number || '5493624522965').replace(/\D/g, '');
  return (
    <footer className="border-t border-zinc-900 bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-amber-400 rounded-lg flex items-center justify-center text-black font-black text-lg">C</div>
              <div>
                <p className="font-bold text-white leading-tight">CLOUD</p>
                <p className="text-[10px] text-amber-400 tracking-widest font-bold uppercase">Servicio Técnico</p>
              </div>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed">Reparación profesional de celulares en Resistencia, Chaco.</p>
          </div>

          <div>
            <p className="font-bold text-white text-sm mb-3">Contacto</p>
            <div className="space-y-2 text-sm text-zinc-400">
              <a href={`https://wa.me/${phone}`} target="_blank" className="block hover:text-amber-400">
                WhatsApp
              </a>
              {config.business_address && <p>{config.business_address}</p>}
              {config.business_hours && <p className="text-xs">{config.business_hours}</p>}
            </div>
          </div>

          <div>
            <p className="font-bold text-white text-sm mb-3">Otros servicios</p>
            <div className="space-y-2 text-sm text-zinc-400">
              <Link href="/" className="block hover:text-amber-400">Tienda ADDANI</Link>
              <Link href="/catalogo" className="block hover:text-amber-400">Catálogo de productos</Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-900 text-center">
          <p className="text-xs text-zinc-600">© CLOUD · Servicio Técnico — Reparación profesional de celulares</p>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════ ATOMS ═══════════════════════════ */

function Progress({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'brand',   label: 'Marca' },
    { key: 'model',   label: 'Modelo' },
    { key: 'service', label: 'Falla' },
    { key: 'variant', label: 'Calidad' },
    { key: 'summary', label: 'Confirmar' },
  ];
  const currentIdx = steps.findIndex(s => s.key === step);

  return (
    <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
      {steps.map((s, idx) => (
        <div key={s.key} className="flex items-center gap-1 flex-shrink-0">
          <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
            idx === currentIdx ? 'bg-amber-400 text-black' :
            idx < currentIdx ? 'bg-amber-500/20 text-amber-400' :
            'bg-zinc-800 text-zinc-500'
          }`}>{s.label}</div>
          {idx < steps.length - 1 && <span className="text-zinc-700 text-xs">›</span>}
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-3">{title}</h2>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: any) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-zinc-500 text-xs uppercase tracking-wider font-bold">{label}</span>
      <span className="font-semibold text-right">{value}</span>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="bg-zinc-900 border border-dashed border-zinc-700 rounded-xl p-8 text-center text-sm text-zinc-400">
      {msg}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, inputMode, textarea }: any) {
  return (
    <div>
      <label className="block text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={2}
          className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-500 focus:border-amber-500 outline-none resize-none" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode}
          className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-500 focus:border-amber-500 outline-none" />
      )}
    </div>
  );
}

/* ═══════════════════════════ ICONS ═══════════════════════════ */

function AdvantageIcon({ name }: { name: string }) {
  const props = { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", strokeWidth: 2 };
  switch (name) {
    case 'check':    return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>;
    case 'shield':   return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.063 2.522-.189 3.758a4.501 4.501 0 0 1-4.092 4.078c-.808.094-1.622.16-2.443.193l-3.55.142-3.55-.142a45.018 45.018 0 0 1-2.443-.193 4.501 4.501 0 0 1-4.092-4.078A45.073 45.073 0 0 1 .442 12c0-1.268.063-2.522.189-3.758a4.501 4.501 0 0 1 4.092-4.078A48.74 48.74 0 0 1 12 4c2.602 0 5.139.193 7.625.523a4.501 4.501 0 0 1 4.092 4.078c.126 1.236.189 2.49.189 3.758Z" /></svg>;
    case 'sparkles': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" /></svg>;
    case 'clock':    return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
    case 'star':     return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>;
    case 'wallet':   return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" /></svg>;
    case 'phone':    return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>;
    case 'wrench':   return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95" /></svg>;
    case 'truck':    return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>;
    case 'heart':    return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>;
    default:         return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>;
  }
}

function PhoneIcon({ className = "w-4 h-4" }: any) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>;
}
function ClockIcon({ className = "w-4 h-4" }: any) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
}
function ShieldIcon({ className = "w-4 h-4" }: any) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
}
function WrenchIcon({ className = "w-4 h-4" }: any) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63" /></svg>;
}
