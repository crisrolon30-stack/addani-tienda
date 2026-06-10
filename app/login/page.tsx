'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/lib/store';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { setCustomer, customer } = useCartStore();

  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (customer) router.push(redirect);
  }, [customer]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanDni = dni.replace(/\D/g, '').trim();

    if (cleanDni.length < 6) {
      setError('Ingresá un DNI válido (solo números)');
      setLoading(false);
      return;
    }

    try {
      const { data, error: dbError } = await supabase
        .from('web_customers')
        .select('*')
        .eq('dni', cleanDni)
        .maybeSingle();

      if (dbError) {
        setError('Error al verificar. Probá de nuevo.');
        setLoading(false);
        return;
      }

      if (!data) {
        setError('DNI no registrado. ¿Querés crear una cuenta?');
        setLoading(false);
        return;
      }

      if (data.blocked) {
        setError('Tu cuenta está bloqueada. Contactanos por WhatsApp.');
        setLoading(false);
        return;
      }

      const bcrypt = await import('bcryptjs');
      const match = await bcrypt.compare(password, data.password_hash || '');

      if (!match) {
        setError('Contraseña incorrecta');
        setLoading(false);
        return;
      }

      await supabase
        .from('web_customers')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);

      setCustomer(data);
      router.push(redirect);
    } catch (err: any) {
      setError('Error: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-rose-50 via-white to-amber-50">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-3 mb-6 group">
            <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl flex items-center justify-center shadow-elegant-lg group-hover:scale-105 transition-transform">
              <span className="text-white font-serif font-bold text-2xl">A</span>
            </div>
          </Link>
          <h1 className="font-serif text-4xl font-bold text-rose-900 tracking-tight">
            Bienvenido
          </h1>
          <p className="text-stone-600 mt-2">Ingresá con tu DNI para continuar</p>
        </div>

        <div className="bg-white rounded-2xl shadow-elegant-xl border border-rose-100 p-7">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-medium animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                DNI
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 bg-rose-50/30 border border-rose-100 rounded-xl text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                placeholder="40123456"
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-rose-50/30 border border-rose-100 rounded-xl text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-rose-600 p-1"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !dni || !password}
              className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white py-3.5 rounded-xl font-bold shadow-elegant-lg disabled:opacity-50"
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>

            <div className="text-center">
              <Link href="/recuperar" className="text-xs text-rose-700 hover:text-rose-800 font-semibold">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-rose-100 text-center">
            <p className="text-sm text-stone-600">
              ¿No tenés cuenta?{' '}
              <Link href="/registro" className="text-rose-700 hover:text-rose-800 font-semibold">
                Registrate
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-stone-400 mt-6">
          Tu compra es segura. Tus datos nunca se comparten.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-rose-50/30" />}>
      <LoginContent />
    </Suspense>
  );
}
