'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/lib/store';

export default function FloatingButtons() {
  const { customer } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="fixed bottom-4 right-4 z-30 flex flex-col gap-2">
      
      
       <a> href="https://wa.me/5493624522965"
        target="_blank"
        className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 rounded-full shadow-elegant-xl flex items-center justify-center text-white text-2xl transition-all hover:scale-110"
        aria-label="WhatsApp"
        title="Consultanos por WhatsApp"
      
        💬
      </a>

      {customer && (
        <Link
          href="/mis-pedidos"
          className="w-14 h-14 bg-rose-600 hover:bg-rose-700 rounded-full shadow-elegant-xl flex items-center justify-center text-white transition-all hover:scale-110"
          aria-label="Mis pedidos"
          title="Mis pedidos"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
          </svg>
        </Link>
      )}
    </div>
  );
}