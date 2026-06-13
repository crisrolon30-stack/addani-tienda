import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

async function getFeaturedProducts() {
  // Primero busca los marcados como destacados
  const { data: featured } = await supabase
    .from('products').select('*')
    .eq('active', true).eq('show_online', true).eq('featured', true).gt('stock', 0)
    .order('created_at', { ascending: false }).limit(8);

  if (featured && featured.length >= 4) return featured;

  // Fallback: completa con los últimos cargados si no hay suficientes destacados
  const { data: latest } = await supabase
    .from('products').select('*')
    .eq('active', true).eq('show_online', true).gt('stock', 0)
    .order('created_at', { ascending: false }).limit(8);

  // Si hay algunos featured, los muestra primero + completa con latest
  if (featured && featured.length > 0) {
    const featuredIds = new Set(featured.map(p => p.id));
    const rest = (latest || []).filter(p => !featuredIds.has(p.id)).slice(0, 8 - featured.length);
    return [...featured, ...rest];
  }
  return latest || [];
}

async function getCategories() {
  const { data } = await supabase
    .from('categories').select('*')
    .eq('active', true).order('display_order').limit(8);
  return data || [];
}

async function getRepairBrands() {
  try {
    const { data } = await supabase.from('repair_brands').select('id, name, logo_url')
      .eq('active', true).order('display_order').limit(9);
    return data || [];
  } catch { return []; }
}

const CategoryIcon = ({ name }: { name?: string }) => {
  const n = (name || '').toLowerCase();
  const cls = "w-7 h-7";

  if (n.includes('maquilla') || n.includes('cosmé') || n.includes('cosme'))
    return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h.01"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/></svg>;

  if (n.includes('bij') || n.includes('joya') || n.includes('access'))
    return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>;

  if (n.includes('ropa') || n.includes('lencer') || n.includes('interior'))
    return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>;

  if (n.includes('perfu') || n.includes('fragan'))
    return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v3"/><path d="M14 2v3"/><path d="M8 5h8a1 1 0 0 1 1 1v2l2 2v9a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-9l2-2V6a1 1 0 0 1 1-1Z"/></svg>;

  if (n.includes('libr') || n.includes('papel') || n.includes('escolar'))
    return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>;

  if (n.includes('celul') || n.includes('telefon') || n.includes('cargad') || n.includes('protector'))
    return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>;

  if (n.includes('pelu') || n.includes('cabell'))
    return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/></svg>;

  return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 14.5 9.5 22 12 14.5 14.5 12 22 9.5 14.5 2 12 9.5 9.5z"/></svg>;
};

export default async function HomePage() {
  const [featured, categories, repairBrands] = await Promise.all([
    getFeaturedProducts(), getCategories(), getRepairBrands(),
  ]);
  const hasRepairService = repairBrands.length > 0;

  return (
    <>
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-amber-50/30 to-rose-50">
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-rose-200/40 to-transparent blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-radial from-amber-200/40 to-transparent blur-3xl" />
        </div>

        <svg className="absolute top-6 left-1/2 -translate-x-1/2 text-rose-300/40 w-32 h-4" viewBox="0 0 128 16" fill="none">
          <path d="M0 8 Q 16 0, 32 8 T 64 8 T 96 8 T 128 8" stroke="currentColor" strokeWidth="1" fill="none"/>
        </svg>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-32">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-12 bg-rose-700" />
              <p className="font-display italic text-rose-800 text-sm tracking-[0.3em] uppercase">
                Desde Resistencia · Chaco
              </p>
            </div>

            <h1 className="leading-[0.95] tracking-tight">
              <span className="block font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-rose-950">
                Tu polirrubro
              </span>
              <span className="block font-display italic text-5xl md:text-7xl lg:text-8xl font-light text-rose-800 mt-1">
                de confianza.
              </span>
            </h1>

            <p className="font-sans text-lg md:text-xl text-stone-700 mt-8 max-w-xl leading-relaxed text-balance">
              Maquillaje, bijouterie, perfumes, ropa interior y mucho más.
              {hasRepairService && (
                <> Y ahora también <span className="font-display italic text-amber-800 font-semibold">servicio técnico de celulares</span>.</>
              )}
            </p>

            <div className="flex flex-wrap gap-3 mt-10">
              <Link href="/catalogo"
                className="group relative inline-flex items-center gap-2 bg-rose-900 hover:bg-rose-950 text-white px-8 py-4 rounded-sm font-medium tracking-wide text-sm uppercase shadow-elegant-lg transition-all">
                <span>Explorar catálogo</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7"/></svg>
              </Link>

              {hasRepairService && (
                <Link href="/servicio-tecnico"
                  className="group inline-flex items-center gap-2 bg-white hover:bg-amber-50 text-amber-900 border border-amber-700/40 px-8 py-4 rounded-sm font-medium tracking-wide text-sm uppercase shadow-soft transition-all">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63"/></svg>
                  <span>Servicio técnico</span>
                </Link>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-12 pt-8 border-t border-rose-200/60">
              <BadgeRow icon={<TrustShield />} text="Productos garantizados" />
              <BadgeRow icon={<TrustStore />} text="Retiro en local" />
              <BadgeRow icon={<TrustHeart />} text="Atención personal" />
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORÍAS */}
      {categories.length > 0 && (
        <section className="bg-[#fdfaf6] py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <SectionHeader kicker="Lo que ofrecemos" title="Categorías" tagline="De la primera necesidad hasta los pequeños caprichos." />

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-12">
              {categories.map((cat: any) => (
                <Link key={cat.id} href={`/catalogo?categoria=${cat.id}`}
                  className="group relative bg-white hover:bg-rose-50 border border-rose-100 hover:border-rose-300 rounded-lg p-5 sm:p-6 transition-all duration-300 hover:shadow-elegant-lg">
                  <div className="aspect-[4/3] flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center text-rose-800 group-hover:scale-110 group-hover:from-rose-200 group-hover:to-amber-200 transition-all duration-300">
                      <CategoryIcon name={cat.name} />
                    </div>
                    <h3 className="font-serif text-base sm:text-lg text-rose-950 text-center leading-tight">
                      {cat.name}
                    </h3>
                  </div>
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 h-px w-0 bg-rose-700 group-hover:w-8 transition-all duration-300" />
                </Link>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link href="/catalogo" className="inline-flex items-center gap-2 font-display italic text-rose-800 hover:text-rose-950 text-lg transition-colors">
                <span>Ver todas las categorías</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12l-7.5 7.5M3 12h17.25"/></svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* SERVICIO TÉCNICO */}
      {hasRepairService && (
        <section className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <svg className="absolute top-0 right-0 w-96 h-96 text-amber-500" viewBox="0 0 200 200" fill="none">
              <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="0.5"/>
              <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="0.5"/>
              <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="0.5"/>
              <circle cx="100" cy="100" r="20" stroke="currentColor" strokeWidth="0.5"/>
            </svg>
            <svg className="absolute bottom-0 left-0 w-80 h-80 text-amber-500" viewBox="0 0 200 200" fill="none">
              <path d="M100 20 L180 100 L100 180 L20 100 Z" stroke="currentColor" strokeWidth="0.5" fill="none"/>
              <path d="M100 40 L160 100 L100 160 L40 100 Z" stroke="currentColor" strokeWidth="0.5" fill="none"/>
            </svg>
          </div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span className="h-px w-12 bg-amber-400" />
                  <p className="font-display italic text-amber-300 text-sm tracking-[0.3em] uppercase">
                    Cloud · Servicio técnico
                  </p>
                </div>

                <h2 className="leading-[0.95] tracking-tight">
                  <span className="block font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-amber-50">
                    Reparación
                  </span>
                  <span className="block font-display italic text-4xl md:text-5xl lg:text-6xl font-light text-amber-300 mt-1">
                    profesional
                  </span>
                  <span className="block font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-amber-50 mt-1">
                    de celulares.
                  </span>
                </h2>

                <p className="font-sans text-amber-100/80 text-lg mt-6 max-w-md leading-relaxed">
                  Cambio de pantalla, batería, pin de carga, liberación y más.
                  <span className="font-display italic text-amber-300"> Diagnóstico gratuito.</span>
                </p>

                <div className="flex flex-wrap gap-3 mt-8">
                  <Link href="/servicio-tecnico"
                    className="group inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-stone-900 px-8 py-4 rounded-sm font-semibold tracking-wide text-sm uppercase shadow-elegant-lg transition-all">
                    <span>Cotizar mi equipo</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7"/></svg>
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-amber-700/30">
                  <ServiceMini label="Pantallas" />
                  <ServiceMini label="Baterías" />
                  <ServiceMini label="Pin de carga" />
                  <ServiceMini label="Liberación" />
                </div>
              </div>

              <div className="relative">
                <div className="bg-gradient-to-br from-stone-800/50 to-amber-950/50 backdrop-blur-sm border border-amber-700/30 rounded-2xl p-8 shadow-elegant-xl">
                  <p className="font-display italic text-amber-300 text-sm tracking-widest uppercase mb-1">Trabajamos con</p>
                  <h3 className="font-serif text-2xl text-amber-50 mb-6">Todas las marcas</h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {repairBrands.slice(0, 9).map((b: any) => (
                      <div key={b.id}
                        className="bg-stone-900/60 hover:bg-amber-900/30 border border-amber-700/20 rounded-lg p-3 transition-colors">
                        <p className="font-serif text-amber-100 text-sm text-center">{b.name}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-amber-700/30 flex items-center justify-between gap-3">
                    <p className="font-display italic text-amber-200 text-base leading-snug">
                      Más de 380 modelos<br />en nuestro sistema
                    </p>
                    <svg className="w-10 h-10 text-amber-400/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* DESTACADOS */}
      {featured.length > 0 && (
        <section className="bg-[#fdfaf6] py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <SectionHeader kicker="Recién llegados" title="Productos destacados" tagline="Lo último que ingresó al local." />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 mt-12">
              {featured.map((p: any) => (
                <Link key={p.id} href={`/producto/${p.id}`}
                  className="group bg-white hover:bg-rose-50/50 border border-stone-200 hover:border-rose-300 rounded-xl overflow-hidden transition-all hover:shadow-elegant-lg">
                  <div className="aspect-square bg-gradient-to-br from-rose-50 to-amber-50 relative overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-12 h-12 text-rose-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                      </div>
                    )}
                    {p.stock <= 3 && p.stock > 0 && (
                      <span className="absolute top-2 right-2 bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wider uppercase border border-amber-300">
                        Últimas {p.stock}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-serif text-base text-stone-900 line-clamp-2 leading-tight">{p.name}</h3>
                    <p className="font-sans font-bold text-rose-900 text-lg mt-2">${p.sale_price.toLocaleString('es-AR')}</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link href="/catalogo" className="inline-flex items-center gap-2 bg-rose-900 hover:bg-rose-950 text-white px-8 py-3.5 rounded-sm font-medium tracking-wide text-sm uppercase shadow-elegant transition-all">
                <span>Ver todo el catálogo</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7"/></svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CONFIANZA */}
      <section className="bg-rose-950 text-rose-50 py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="font-display italic text-rose-300 text-sm tracking-[0.3em] uppercase mb-3">Nuestra promesa</p>
            <h2 className="font-serif text-3xl md:text-4xl text-rose-50">
              Por qué <span className="italic font-display text-amber-300">elegirnos</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <ValueCard title="Calidad garantizada" text="Solo productos originales y con garantía. Si algo no te sirve, lo solucionamos." icon={<TrustShield />} />
            <ValueCard title="Atención personal" text="Te recibimos en el local con la misma dedicación que tendrías con una amiga." icon={<TrustHeart />} />
            <ValueCard title="Retiro en Resistencia" text="Pedí online y retirá en local. Sin envío, sin demoras, sin sorpresas." icon={<TrustStore />} />
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

function SectionHeader({ kicker, title, tagline }: { kicker: string; title: string; tagline: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-3 mb-4">
        <span className="h-px w-8 bg-rose-700" />
        <p className="font-display italic text-rose-800 text-sm tracking-[0.3em] uppercase">{kicker}</p>
        <span className="h-px w-8 bg-rose-700" />
      </div>
      <h2 className="font-serif text-3xl md:text-5xl text-rose-950 leading-tight">{title}</h2>
      <p className="font-display italic text-stone-600 text-lg md:text-xl mt-3">{tagline}</p>
    </div>
  );
}

function BadgeRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-rose-700">{icon}</span>
      <span className="font-sans text-stone-700 text-sm">{text}</span>
    </div>
  );
}

function ServiceMini({ label }: { label: string }) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 mx-auto rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mb-2">
        <svg className="w-4 h-4 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>
      </div>
      <p className="font-display italic text-amber-100 text-sm">{label}</p>
    </div>
  );
}

function ValueCard({ title, text, icon }: { title: string; text: string; icon: React.ReactNode }) {
  return (
    <div className="bg-rose-900/40 border border-rose-700/30 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
      <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300 mb-5">
        {icon}
      </div>
      <h3 className="font-serif text-xl text-rose-50 mb-2">{title}</h3>
      <p className="font-sans text-rose-200/80 text-sm leading-relaxed">{text}</p>
    </div>
  );
}

function TrustShield() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>;
}
function TrustStore() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>;
}
function TrustHeart() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>;
}
