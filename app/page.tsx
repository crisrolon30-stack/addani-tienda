import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

async function getFeaturedProducts() {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .eq('show_online', true)
    .gt('stock', 0)
    .order('created_at', { ascending: false })
    .limit(8);
  return data || [];
}

async function getCategories() {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('active', true)
    .order('display_order')
    .limit(6);
  return data || [];
}

async function getRepairConfig() {
  try {
    const { data } = await supabase
      .from('repair_config')
      .select('*')
      .limit(1)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

async function getRepairBrands() {
  try {
    const { data } = await supabase
      .from('repair_brands')
      .select('id, name, logo_url')
      .eq('active', true)
      .order('display_order')
      .limit(8);
    return data || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [featured, categories, repairBrands, repairConfig] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
    getRepairBrands(),
    getRepairConfig(),
  ]);

  const hasRepairService = repairBrands.length > 0;

  return (
    <>
      <Header />

      {/* ═══ HERO PRINCIPAL ═══ */}
      <section className="relative bg-gradient-to-br from-rose-100 via-rose-50 to-amber-50 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-72 h-72 bg-rose-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-200 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-28">
          <div className="max-w-2xl">
            <p className="text-rose-700 font-semibold tracking-widest uppercase text-sm mb-4">
              Bienvenida a ADDANI
            </p>
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-rose-900 leading-tight tracking-tight">
              Tu boutique<br />
              <span className="italic text-rose-700">de confianza</span>
            </h1>
            <p className="text-lg text-stone-700 mt-6 leading-relaxed max-w-xl">
              Maquillaje, bijouterie, ropa interior y mucho más. Y ahora también
              <span className="text-amber-700 font-semibold"> servicio técnico de celulares</span>.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link href="/catalogo" className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white px-8 py-3.5 rounded-xl font-semibold shadow-elegant-lg">
                Ver catálogo →
              </Link>
              {hasRepairService && (
                <Link href="/servicio-tecnico" className="bg-white hover:bg-amber-50 text-amber-700 border-2 border-amber-300 px-8 py-3.5 rounded-xl font-semibold shadow-elegant inline-flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                  Reparar mi celular
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DOS NEGOCIOS — selector visual ═══ */}
      {hasRepairService && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="text-center mb-8">
            <p className="text-stone-500 font-semibold tracking-widest uppercase text-xs mb-2">¿Qué buscás hoy?</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-stone-900">
              Dos servicios, una sola casa
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* BOUTIQUE */}
            <Link href="/catalogo" className="group relative bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700 rounded-3xl p-8 overflow-hidden text-white transition-all hover:-translate-y-1 shadow-elegant-lg hover:shadow-elegant-xl">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
              <div className="relative">
                <p className="text-rose-100 text-xs font-bold tracking-widest uppercase mb-3">ADDANI · Boutique</p>
                <h3 className="font-serif text-3xl md:text-4xl font-bold leading-tight">
                  Maquillaje,<br />
                  <span className="italic">bijou y más</span>
                </h3>
                <p className="text-rose-50 mt-4 text-sm leading-relaxed">
                  Compras online, retirás en el local. Productos elegidos uno por uno.
                </p>
                <span className="inline-flex items-center gap-2 mt-6 font-semibold group-hover:gap-3 transition-all">
                  Ir al catálogo
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </div>
            </Link>

            {/* CLOUD SERVICIO TECNICO */}
            <Link href="/servicio-tecnico" className="group relative bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-3xl p-8 overflow-hidden text-white transition-all hover:-translate-y-1 shadow-elegant-lg hover:shadow-elegant-xl border border-amber-500/20">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-amber-400 rounded flex items-center justify-center text-black font-black text-sm">C</div>
                  <p className="text-amber-400 text-xs font-bold tracking-widest uppercase">CLOUD · Servicio Técnico</p>
                </div>
                <h3 className="text-3xl md:text-4xl font-black leading-tight">
                  Reparación<br />
                  <span className="text-amber-400">profesional</span>
                </h3>
                <p className="text-zinc-300 mt-4 text-sm leading-relaxed">
                  Cotizá tu reparación en minutos. Diagnóstico sin cargo, garantía escrita.
                </p>
                {(repairConfig?.years_experience || repairConfig?.repairs_count || repairConfig?.rating_overall) && (
                  <div className="flex gap-4 mt-4 text-xs">
                    {repairConfig.years_experience && (
                      <span><strong className="text-amber-400 text-base">{repairConfig.years_experience}+</strong> <span className="text-zinc-500">años</span></span>
                    )}
                    {repairConfig.repairs_count && (
                      <span><strong className="text-amber-400 text-base">{repairConfig.repairs_count}+</strong> <span className="text-zinc-500">reparaciones</span></span>
                    )}
                    {repairConfig.rating_overall && (
                      <span><strong className="text-amber-400 text-base">{repairConfig.rating_overall}★</strong></span>
                    )}
                  </div>
                )}
                <span className="inline-flex items-center gap-2 mt-6 font-bold text-amber-400 group-hover:gap-3 transition-all">
                  Cotizar reparación
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </span>

                {/* Logos de marcas */}
                {repairBrands.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-zinc-700/50">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-2">Reparamos</p>
                    <div className="flex flex-wrap gap-2">
                      {repairBrands.slice(0, 5).map(b => (
                        <span key={b.id} className="text-[11px] bg-zinc-800/80 border border-zinc-700 px-2 py-1 rounded-md font-semibold text-zinc-300">
                          {b.name}
                        </span>
                      ))}
                      {repairBrands.length > 5 && (
                        <span className="text-[11px] text-amber-400/70 px-2 py-1 font-semibold">+{repairBrands.length - 5} más</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ═══ CATEGORIAS ═══ */}
      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="text-center mb-10">
            <p className="text-rose-700 font-semibold tracking-widest uppercase text-xs mb-2">Explorá la boutique</p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-rose-900">
              Nuestras <span className="italic">categorías</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/catalogo?categoria=${cat.id}`}
                className="group bg-white rounded-2xl p-8 text-center shadow-elegant hover:shadow-elegant-lg border border-rose-50 hover:border-rose-200 transition-all"
              >
                <div className="text-5xl mb-3">{cat.icon || '📦'}</div>
                <p className="font-serif text-xl font-bold text-rose-900">{cat.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══ PRODUCTOS DESTACADOS ═══ */}
      {featured.length > 0 && (
        <section className="bg-rose-50/40 py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
              <div>
                <p className="text-rose-700 font-semibold tracking-widest uppercase text-xs mb-2">Recién llegados</p>
                <h2 className="font-serif text-4xl md:text-5xl font-bold text-rose-900">
                  Productos <span className="italic">destacados</span>
                </h2>
              </div>
              <Link href="/catalogo" className="text-rose-700 hover:text-rose-800 font-semibold text-sm">
                Ver todos →
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featured.map(product => (
                <Link key={product.id} href={`/producto/${product.id}`} className="group bg-white rounded-2xl overflow-hidden shadow-elegant hover:shadow-elegant-lg transition-all">
                  <div className="aspect-square bg-rose-50 overflow-hidden">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-rose-200">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    {product.brand && <p className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">{product.brand}</p>}
                    <p className="font-semibold text-stone-900 text-sm mt-0.5 line-clamp-2 min-h-[2.5em]">{product.name}</p>
                    <p className="font-serif font-bold text-xl text-rose-700 mt-2">
                      ${product.sale_price.toLocaleString('es-AR')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ VENTAJAS GENERALES ═══ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <FeatureCard
            iconBg="from-rose-500 to-rose-600"
            iconSvg={<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.063 2.522-.189 3.758a4.501 4.501 0 0 1-4.092 4.078c-.808.094-1.622.16-2.443.193l-3.55.142-3.55-.142a45.018 45.018 0 0 1-2.443-.193 4.501 4.501 0 0 1-4.092-4.078A45.073 45.073 0 0 1 .442 12c0-1.268.063-2.522.189-3.758a4.501 4.501 0 0 1 4.092-4.078A48.74 48.74 0 0 1 12 4c2.602 0 5.139.193 7.625.523a4.501 4.501 0 0 1 4.092 4.078c.126 1.236.189 2.49.189 3.758Z" />}
            title="Calidad garantizada"
            description="Productos elegidos uno por uno. Reparaciones con garantía escrita."
          />
          <FeatureCard
            iconBg="from-amber-500 to-amber-600"
            iconSvg={<path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />}
            title="Rápido y simple"
            description="Compras online en minutos. Reparaciones en 24-48 hs."
          />
          <FeatureCard
            iconBg="from-emerald-500 to-emerald-600"
            iconSvg={<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />}
            title="Atención personal"
            description="Te atendemos por WhatsApp para cualquier consulta."
          />
        </div>
      </section>

      <Footer />
    </>
  );
}

function FeatureCard({ iconBg, iconSvg, title, description }: { iconBg: string; iconSvg: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-elegant border border-stone-100 hover:border-stone-200 transition-colors">
      <div className={`w-14 h-14 mx-auto bg-gradient-to-br ${iconBg} rounded-2xl flex items-center justify-center text-white mb-4 shadow-elegant`}>
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          {iconSvg}
        </svg>
      </div>
      <p className="font-serif text-xl font-bold text-stone-900 mb-2">{title}</p>
      <p className="text-sm text-stone-600 leading-relaxed">{description}</p>
    </div>
  );
}
