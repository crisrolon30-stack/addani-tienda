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

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);

  return (
    <>
      <Header />

      <section className="relative bg-gradient-to-br from-rose-100 via-rose-50 to-amber-50 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-72 h-72 bg-rose-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-200 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-32">
          <div className="max-w-2xl">
            <p className="text-rose-700 font-semibold tracking-widest uppercase text-sm mb-4">
              Bienvenida a ADDANI
            </p>
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-rose-900 leading-tight tracking-tight">
              Tu boutique<br />
              <span className="italic text-rose-700">de confianza</span>
            </h1>
            <p className="text-lg text-stone-700 mt-6 leading-relaxed max-w-xl">
              Maquillaje, bijouterie, ropa interior y mucho más.<br />
              Calidad pensada para vos, al alcance de un click.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link href="/catalogo" className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white px-8 py-3.5 rounded-xl font-semibold shadow-elegant-lg">
                Ver catálogo →
              </Link>
              <Link href="/contacto" className="bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 px-8 py-3.5 rounded-xl font-semibold shadow-elegant">
                Contactanos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-10">
            <p className="text-rose-700 font-semibold tracking-widest uppercase text-xs mb-2">Explorá</p>
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

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <FeatureCard
            icon="🛍️"
            title="Calidad seleccionada"
            description="Productos elegidos uno por uno pensando en vos"
          />
          <FeatureCard
            icon="🏠"
            title="Retirá en local"
            description="Compras online, retirás cuando puedas"
          />
          <FeatureCard
            icon="💬"
            title="Atención personal"
            description="Te atendemos por WhatsApp para cualquier consulta"
          />
        </div>
      </section>

      <Footer />
    </>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-elegant border border-rose-50">
      <div className="text-5xl mb-3">{icon}</div>
      <p className="font-serif text-xl font-bold text-rose-900 mb-2">{title}</p>
      <p className="text-sm text-stone-600 leading-relaxed">{description}</p>
    </div>
  );
}