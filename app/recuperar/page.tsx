'use client';

import Link from 'next/link';

export default function RecuperarPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-rose-50 via-white to-amber-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-elegant-xl border border-rose-100 p-7 text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔑</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-rose-900 tracking-tight mb-3">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="text-stone-600 mb-6 leading-relaxed">
            Contactanos por WhatsApp y te ayudamos a recuperar tu cuenta en minutos.
          </p>

          <a
            href="https://wa.me/5493624522965?text=Hola%20ADDANI!%20Olvid%C3%A9%20mi%20contrase%C3%B1a"
            target="_blank"
            className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold shadow-elegant-lg"
          >
            💬 Recuperar por WhatsApp
          </a>

          <Link href="/login" className="block mt-4 text-sm text-rose-700 hover:text-rose-800 font-semibold">
            ← Volver al login
          </Link>
        </div>
      </div>
    </div>
  );
}