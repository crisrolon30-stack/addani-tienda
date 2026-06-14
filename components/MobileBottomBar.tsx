'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/lib/store';

/**
 * Barra inferior fija en mobile - siempre accesible para vender desde el celular.
 * Se oculta en desktop (md+). Crítica para UX de e-commerce mobile.
 */
export default function MobileBottomBar() {
  const pathname = usePathname();
  const { getItemCount, customer } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // No mostrar en checkout/pagar (el cliente está concentrado completando datos)
  const hideBar = pathname.startsWith('/checkout') || pathname.startsWith('/pagar') || pathname.startsWith('/confirmacion');
  if (hideBar) return null;

  const count = mounted ? getItemCount() : 0;

  return (
    <>
      {/* Spacer para que el contenido no quede tapado por la barra */}
      <div className="md:hidden h-16" aria-hidden="true" />

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-rose-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)] safe-bottom">
        <div className="grid grid-cols-4 h-16">

          <Link href="/" className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${pathname === '/' ? 'text-rose-700' : 'text-stone-500'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span className="text-[10px] font-medium">Inicio</span>
          </Link>

          <Link href="/catalogo" className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${pathname.startsWith('/catalogo') ? 'text-rose-700' : 'text-stone-500'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
            <span className="text-[10px] font-medium">Catálogo</span>
          </Link>

          <Link href="/servicio-tecnico" className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${pathname.startsWith('/servicio-tecnico') ? 'text-amber-600' : 'text-stone-500'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
            </svg>
            <span className="text-[10px] font-medium">Técnico</span>
          </Link>

          <Link
            href={customer ? '/mi-cuenta' : '/login'}
            className={`flex flex-col items-center justify-center gap-0.5 relative transition-colors ${pathname.startsWith('/mi-cuenta') || pathname.startsWith('/login') ? 'text-rose-700' : 'text-stone-500'}`}
          >
            <div className="relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              {count > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                  {count}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{customer ? 'Mi cuenta' : 'Ingresar'}</span>
          </Link>

        </div>
      </nav>
    </>
  );
}
