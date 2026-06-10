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
      <main className="max-w-6xl mx-auto px-4 py-6">

        <h1 className="font-serif text-3xl font-bold text-rose-900 mb-1">
          {activeCatName ? `${activeCatName.icon} ${activeCatName.name}` : 'Catálogo'}
        </h1>
        <p className="text-stone-500 text-sm mb-5">{filtered.length} productos</p>

        {/* Buscador */}
        <div className="relative mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full px-4 py-3 bg-white border border-rose-100 rounded-xl text-stone-900 placeholder:text-stone-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none"
          />
        </div>

        {/* Filtros de categoría */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveCat('all')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeCat === 'all' ? 'bg-rose-600 text-white' : 'bg-white text-stone-600 border border-rose-100 hover:border-rose-300'
              }`}
            >
              Todas
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  activeCat === cat.id ? 'bg-rose-600 text-white' : 'bg-white text-stone-600 border border-rose-100 hover:border-rose-300'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse">
                <div className="aspect-square bg-rose-100" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-rose-100 rounded w-3/4" />
                  <div className="h-5 bg-rose-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-rose-100 rounded-2xl p-12 text-center">
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl">🔍</span>
            </div>
            <p className="font-bold text-rose-900">Sin resultados</p>
            <p className="text-sm text-stone-500 mt-1">Probá con otra búsqueda o categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {filtered.map((product) => {
              const qty = items.find(i => i.product_id === product.id)?.quantity || 0;
              const justAdded = added === product.id;
              const outOfStock = product.stock === 0;

              return (
                <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-md">
                  <Link href={`/producto/${product.id}`}>
                    <div className="aspect-square bg-rose-50 relative">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl text-rose-200">📦</div>
                      )}
                      {qty > 0 && (
                        <div className="absolute top-2 left-2 bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {qty} en carrito
                        </div>
                      )}
                      {outOfStock && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <span className="bg-stone-800 text-white text-xs font-bold px-3 py-1.5 rounded-full">Agotado</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      {product.brand && (
                        <p className="text-[10px] text-stone-500 uppercase font-bold">{product.brand}</p>
                      )}
                      <p className="font-medium text-stone-900 text-sm line-clamp-2 min-h-[2.5em]">{product.name}</p>
                      <p className="font-bold text-xl text-rose-700 mt-1">
                        ${Number(product.sale_price).toLocaleString('es-AR')}
                      </p>
                    </div>
                  </Link>

                  <div className="p-3 pt-0">
                    <button
                      onClick={(e) => handleAdd(e, product)}
                      disabled={outOfStock || justAdded}
                      className={`w-full py-2.5 rounded-xl font-medium text-xs uppercase tracking-wider transition-all ${
                        outOfStock
                          ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                          : justAdded
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50 hover:border-rose-400'
                      }`}
                    >
                      {outOfStock ? 'Agotado' : justAdded ? '✓ Agregado' : 'Agregar'}
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
    <Suspense fallback={<div className="min-h-screen bg-rose-50/30" />}>
      <CatalogoContent />
    </Suspense>
  );
}
