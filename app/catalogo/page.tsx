'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/lib/store';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function CatalogoContent() {
  const searchParams = useSearchParams();
  const { addItem, items } = useCartStore();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState<string>('all');

  useEffect(() => {
    const cat = searchParams.get('categoria');
    if (cat) setActiveCat(cat);
    loadData();
  }, []);

  const loadData = async () => {
    const [prodResult, catResult] = await Promise.all([
      supabase.from('products').select('*').eq('active', true).eq('show_online', true),
      supabase.from('categories').select('*').eq('active', true).order('display_order'),
    ]);
    setProducts(prodResult.data || []);
    setCategories(catResult.data || []);
    setLoading(false);
  };

  const handleAdd = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      product_id: product.id,
      product_name: product.name,
      product_image: product.images?.[0],
      quantity: 1,
      unit_price: product.sale_price,
      subtotal: product.sale_price,
      category_id: product.category_id,
    });
    setAdded(product.id);
    setTimeout(() => setAdded(null), 1500);
  };

  const filtered = products.filter(p => {
    const matchCat = activeCat === 'all' || p.category_id === activeCat;
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const activeCatName = categories.find(c => c.id === activeCat);

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* Header de la página */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px w-12 bg-rose-700" />
            <p className="font-display italic text-rose-800 text-xs tracking-[0.3em] uppercase">
              {activeCatName ? activeCatName.name : 'Todo el catálogo'}
            </p>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-rose-950 leading-tight">
            {activeCatName ? activeCatName.name : (
              <>Nuestro <span className="font-display italic">catálogo</span></>
            )}
          </h1>
          <p className="font-sans text-stone-600 text-sm mt-2">{filtered.length} {filtered.length === 1 ? 'producto disponible' : 'productos disponibles'}</p>
        </div>

        {/* Buscador editorial */}
        <div className="relative mb-5">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-700/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto, marca o tipo..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-rose-200 rounded-sm text-stone-900 placeholder:text-stone-400 focus:border-rose-700 outline-none font-sans shadow-soft"
          />
        </div>

        {/* Categorías como pills editoriales */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveCat('all')}
              className={`px-5 py-2 rounded-sm text-xs font-medium tracking-wide uppercase transition-all ${
                activeCat === 'all'
                  ? 'bg-rose-900 text-white shadow-elegant'
                  : 'bg-white text-rose-900 border border-rose-200 hover:border-rose-700'
              }`}
            >
              Todas
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`px-5 py-2 rounded-sm text-xs font-medium tracking-wide uppercase transition-all ${
                  activeCat === cat.id
                    ? 'bg-rose-900 text-white shadow-elegant'
                    : 'bg-white text-rose-900 border border-rose-200 hover:border-rose-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Grid de productos */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="bg-white border border-stone-200 rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-gradient-to-br from-rose-50 to-amber-50" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-rose-100 rounded w-3/4" />
                  <div className="h-5 bg-rose-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-rose-200 rounded-xl p-16 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-rose-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <p className="font-serif text-xl text-rose-950">Sin resultados</p>
            <p className="font-sans text-sm text-stone-500 mt-1">Probá con otra búsqueda o categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {filtered.map((product) => {
              const qty = items.find(i => i.product_id === product.id)?.quantity || 0;
              const justAdded = added === product.id;
              const outOfStock = product.stock === 0;
              const lowStock = product.stock > 0 && product.stock <= 3;

              return (
                <div key={product.id} className="group bg-white border border-stone-200 hover:border-rose-300 rounded-xl overflow-hidden transition-all hover:shadow-elegant-lg">
                  <Link href={`/producto/${product.id}`} className="block">
                    <div className="aspect-square bg-gradient-to-br from-rose-50 to-amber-50 relative overflow-hidden">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-12 h-12 text-rose-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <circle cx="9" cy="9" r="2"/>
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                          </svg>
                        </div>
                      )}

                      {qty > 0 && (
                        <div className="absolute top-2 left-2 bg-rose-900 text-white text-[10px] font-medium tracking-wider uppercase px-2 py-1 rounded-sm shadow-elegant">
                          {qty} en carrito
                        </div>
                      )}

                      {lowStock && !outOfStock && (
                        <div className="absolute top-2 right-2 bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wider uppercase border border-amber-300">
                          Últimas {product.stock}
                        </div>
                      )}

                      {outOfStock && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="bg-stone-900 text-white text-[10px] font-medium tracking-widest uppercase px-4 py-2">
                            Agotado
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      {product.brand && (
                        <p className="font-display italic text-[10px] text-stone-500 tracking-widest uppercase mb-1">{product.brand}</p>
                      )}
                      <h3 className="font-serif text-sm text-stone-900 line-clamp-2 leading-snug min-h-[2.5em]">{product.name}</h3>
                      <p className="font-sans font-bold text-lg text-rose-900 mt-2">
                        ${Number(product.sale_price).toLocaleString('es-AR')}
                      </p>
                    </div>
                  </Link>

                  <div className="px-4 pb-4">
                    <button
                      onClick={(e) => handleAdd(e, product)}
                      disabled={outOfStock || justAdded}
                      className={`w-full py-2.5 rounded-sm font-medium text-[11px] uppercase tracking-widest transition-all ${
                        outOfStock
                          ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                          : justAdded
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-white text-rose-900 border border-rose-300 hover:bg-rose-900 hover:text-white hover:border-rose-900'
                      }`}
                    >
                      {outOfStock ? 'No disponible' : justAdded ? '✓ Agregado' : 'Agregar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fdfaf6]" />}>
      <CatalogoContent />
    </Suspense>
  );
}
