'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/lib/store';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ProductoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { addItem, items } = useCartStore();

  const [product, setProduct] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [params.id]);

  const loadProduct = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .eq('active', true)
      .maybeSingle();

    if (!data) {
      setLoading(false);
      return;
    }

    setProduct(data);
    setActiveImage(0);
    setQuantity(1);

    if (data.category_id) {
      const [catResult, relResult] = await Promise.all([
        supabase.from('categories').select('*').eq('id', data.category_id).maybeSingle(),
        supabase.from('products').select('*')
          .eq('category_id', data.category_id)
          .eq('active', true)
          .eq('show_online', true)
          .neq('id', data.id)
          .limit(4),
      ]);
      setCategory(catResult.data);
      setRelated(relResult.data || []);
    }

    setLoading(false);
  };

  const handleAdd = () => {
    if (!product) return;
    addItem({
      product_id: product.id,
      product_name: product.name,
      product_image: product.images?.[0],
      quantity,
      unit_price: product.sale_price,
      subtotal: product.sale_price * quantity,
      category_id: product.category_id,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid md:grid-cols-2 gap-8 animate-pulse">
            <div className="aspect-square bg-rose-100 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-rose-100 rounded w-2/3" />
              <div className="h-6 bg-rose-100 rounded w-1/3" />
              <div className="h-24 bg-rose-50 rounded" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔍</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-rose-900 mb-2">Producto no encontrado</h1>
          <p className="text-stone-600 mb-6">Puede que ya no esté disponible.</p>
          <Link href="/catalogo" className="inline-block bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-semibold">
            Volver al catálogo
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const gallery: string[] = (product.online_gallery?.length ? product.online_gallery : product.images) || [];
  const inCart = items.find(i => i.product_id === product.id)?.quantity || 0;
  const outOfStock = product.stock === 0;
  const description = product.online_description || product.description || '';

  return (
    <>
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        <div className="flex items-center gap-2 text-sm text-stone-500 mb-5">
          <Link href="/catalogo" className="hover:text-rose-700">Catálogo</Link>
          {category && (
            <>
              <span>/</span>
              <span className="text-stone-700">{category.icon} {category.name}</span>
            </>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">

          {/* Galería */}
          <div>
            <div className="aspect-square bg-rose-50 rounded-2xl overflow-hidden border border-rose-100">
              {gallery[activeImage] ? (
                <img src={gallery[activeImage]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl text-rose-200">📦</div>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-colors ${
                      activeImage === idx ? 'border-rose-500' : 'border-rose-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.brand && (
              <p className="text-xs text-stone-500 uppercase font-bold tracking-wider">{product.brand}</p>
            )}
            <h1 className="font-serif text-3xl font-bold text-rose-900 tracking-tight mt-1">{product.name}</h1>

            <p className="font-serif text-4xl font-bold text-rose-700 mt-4">
              ${Number(product.sale_price).toLocaleString('es-AR')}
            </p>

            <div className="mt-3">
              {outOfStock ? (
                <span className="inline-block bg-stone-100 text-stone-500 text-sm font-semibold px-3 py-1 rounded-full">
                  Sin stock
                </span>
              ) : product.stock <= 5 ? (
                <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200 text-sm font-semibold px-3 py-1 rounded-full">
                  ¡Últimas {product.stock} unidades!
                </span>
              ) : (
                <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-semibold px-3 py-1 rounded-full">
                  Disponible
                </span>
              )}
            </div>

            {description && (
              <div className="mt-5 text-stone-700 leading-relaxed whitespace-pre-line">
                {description}
              </div>
            )}

            {inCart > 0 && (
              <p className="mt-4 text-sm text-rose-700 font-medium">
                Ya tenés {inCart} en el carrito
              </p>
            )}

            {!outOfStock && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-stone-700">Cantidad</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-9 h-9 bg-white border border-rose-200 rounded-lg text-rose-700 font-bold hover:bg-rose-50"
                    >
                      −
                    </button>
                    <span className="font-bold text-stone-900 w-10 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => Math.min(product.stock - inCart, q + 1))}
                      disabled={quantity >= product.stock - inCart}
                      className="w-9 h-9 bg-white border border-rose-200 rounded-lg text-rose-700 font-bold hover:bg-rose-50 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  {quantity >= product.stock - inCart && inCart > 0 && (
                    <span className="text-[10px] text-amber-700 font-medium">Stock máx alcanzado</span>
                  )}
                </div>

                <button
                  onClick={handleAdd}
                  disabled={added || product.stock - inCart <= 0}
                  className={`w-full py-4 rounded-xl font-bold shadow-elegant-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    added
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white'
                  }`}
                >
                  {added ? '✓ Agregado al carrito' : product.stock - inCart <= 0 ? 'Ya tenés todo el stock' : 'Agregar al carrito'}
                </button>
              </div>
            )}

            {outOfStock && (
              <a
                href={`https://wa.me/5493624522965?text=Hola!%20Quiero%20consultar%20por%20${encodeURIComponent(product.name)}`}
                target="_blank"
                className="mt-6 block w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold text-center"
              >
                💬 Consultar disponibilidad
              </a>
            )}
          </div>
        </div>

        {/* Relacionados */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="font-serif text-2xl font-bold text-rose-900 mb-4">También te puede gustar</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map(p => (
                <Link key={p.id} href={`/producto/${p.id}`} className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-rose-50">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl text-rose-200">📦</div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-stone-900 text-sm truncate">{p.name}</p>
                    <p className="font-bold text-lg text-rose-700 mt-1">
                      ${Number(p.sale_price).toLocaleString('es-AR')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
