'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCartStore } from '@/lib/store';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { getItemCount, customer, logout } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => setMounted(true), []);

  const itemCount = mounted ? getItemCount() : 0;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <>
      <header className="sticky top-0 z-40 glass border-b border-rose-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-rose-700 rounded-xl flex items-center justify-center shadow-elegant group-hover:scale-105 transition-transform">
              <span className="text-white font-serif font-bold text-lg">A</span>
            </div>
            <div className="hidden sm:block">
              <p className="font-serif font-bold text-xl text-rose-900 tracking-tight leading-none">ADDANI</p>
              <p className="text-[10px] text-rose-700/60 tracking-widest uppercase mt-0.5">Polirrubro</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            <Link href="/" className={`text-sm font-medium transition-colors ${pathname === '/' ? 'text-rose-700' : 'text-stone-700 hover:text-rose-700'}`}>
              Inicio
            </Link>
            <Link href="/catalogo" className={`text-sm font-medium transition-colors ${pathname.startsWith('/catalogo') ? 'text-rose-700' : 'text-stone-700 hover:text-rose-700'}`}>
              Catálogo
            </Link>
            {customer && (
              <Link href="/mis-pedidos" className={`text-sm font-medium transition-colors ${pathname === '/mis-pedidos' ? 'text-rose-700' : 'text-stone-700 hover:text-rose-700'}`}>
                Mis pedidos
              </Link>
            )}
            <Link href="/contacto" className={`text-sm font-medium transition-colors ${pathname === '/contacto' ? 'text-rose-700' : 'text-stone-700 hover:text-rose-700'}`}>
              Contacto
            </Link>
            <Link href="/servicio-tecnico" className={`text-sm font-bold transition-colors flex items-center gap-1.5 ${pathname.startsWith('/servicio-tecnico') ? 'text-amber-600' : 'text-stone-700 hover:text-amber-600'}`}>
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              Servicio Técnico
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            
            <button
              onClick={() => setShowCart(true)}
              className="relative p-2.5 hover:bg-rose-50 rounded-xl transition-colors"
              aria-label="Carrito"
            >
              <svg className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-elegant">
                  {itemCount}
                </span>
              )}
            </button>

            {customer ? (
              <div className="relative">
                <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 p-1.5 pr-3 hover:bg-rose-50 rounded-xl transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {customer.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-stone-700">
                    {customer.full_name.split(' ')[0]}
                  </span>
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-12 z-20 bg-white border border-rose-100 rounded-xl shadow-elegant-lg min-w-[200px] py-1 animate-fade-in">
                      <Link href="/mi-cuenta" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-stone-700 hover:bg-rose-50">
                        Mi cuenta
                      </Link>
                      <Link href="/mis-pedidos" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-stone-700 hover:bg-rose-50">
                        Mis pedidos
                      </Link>
                      <Link href="/mis-reparaciones" onClick={() => setMenuOpen(false)} className="flex items-center justify-between px-4 py-2.5 text-sm text-stone-700 hover:bg-amber-50">
                        <span>Mis reparaciones</span>
                        <span className="text-[9px] bg-amber-500/10 text-amber-700 px-1.5 py-0.5 rounded font-bold">CLOUD</span>
                      </Link>
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2.5 text-sm text-rose-700 hover:bg-rose-50 border-t border-rose-100">
                        Cerrar sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link href="/login" className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-elegant transition-colors">
                Ingresar
              </Link>
            )}
          </div>
        </div>
      </header>

      {showCart && <CartDrawer onClose={() => setShowCart(false)} />}
    </>
  );
}

function CartDrawer({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotal, customer } = useCartStore();
  const total = getTotal();

  const handleCheckout = () => {
    if (!customer) {
      onClose();
      router.push('/login?redirect=/checkout');
      return;
    }
    onClose();
    router.push('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-elegant-xl flex flex-col animate-slide-in-right">
        
        <div className="px-5 py-4 border-b border-rose-100 flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-rose-900">Mi carrito</h2>
          <button onClick={onClose} className="p-2 hover:bg-rose-50 rounded-lg">
            <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
            </div>
            <p className="text-stone-600 font-medium">Tu carrito está vacío</p>
            <Link href="/catalogo" onClick={onClose} className="mt-5 bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-elegant">
              Explorar productos
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {items.map(item => (
                <div key={item.product_id} className="bg-rose-50/40 rounded-xl p-3 flex gap-3">
                  <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-rose-100">
                    {item.product_image ? (
                      <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-rose-200">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">{item.product_name}</p>
                    <p className="text-xs text-stone-500 mt-0.5">${item.unit_price.toLocaleString('es-AR')} c/u</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="w-7 h-7 bg-white border border-rose-200 rounded-lg text-rose-700 font-bold hover:bg-rose-50">−</button>
                        <span className="font-bold text-stone-900 w-7 text-center text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="w-7 h-7 bg-white border border-rose-200 rounded-lg text-rose-700 font-bold hover:bg-rose-50">+</button>
                      </div>
                      <p className="font-bold text-rose-900">${item.subtotal.toLocaleString('es-AR')}</p>
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.product_id)} className="text-stone-400 hover:text-rose-600 p-1 self-start">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-rose-100 p-5 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-stone-700 font-medium">Total</span>
                <span className="font-serif text-3xl font-bold text-rose-900">
                  ${total.toLocaleString('es-AR')}
                </span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white py-3.5 rounded-xl font-bold shadow-elegant-lg"
              >
                Continuar compra →
              </button>
              <Link
                href="/catalogo"
                onClick={onClose}
                className="block text-center text-sm text-stone-600 hover:text-rose-700 py-1"
              >
                Seguir comprando
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}