'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/lib/store';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { setCustomer } = useCartStore();

  const [formData, setFormData] = useState({
    full_name: '',
    dni: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const fullName = formData.full_name.trim();
    const dni = formData.dni.replace(/\D/g, '').trim();
    const phone = formData.phone.replace(/\D/g, '').trim();

    if (!fullName) {
      setError('Ingresá tu nombre completo');
      return;
    }

    if (dni.length < 6) {
      setError('Ingresá un DNI válido (solo números)');
      return;
    }

    if (!phone) {
      setError('El WhatsApp es obligatorio para avisarte de tu pedido');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const { data: existing, error: searchError } = await supabase
        .from('web_customers')
        .select('id, dni')
        .eq('dni', dni)
        .maybeSingle();

      if (searchError) {
        setError('Error al verificar: ' + searchError.message);
        setLoading(false);
        return;
      }

      if (existing) {
        setError('Ya existe una cuenta con ese DNI. Iniciá sesión.');
        setLoading(false);
        return;
      }

      const bcrypt = await import('bcryptjs');
      const hash = await bcrypt.hash(formData.password, 10);

      const { data: newCustomer, error: insertError } = await supabase
        .from('web_customers')
        .insert({
          dni,
          full_name: fullName,
          phone,
          password_hash: hash,
          last_login: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        setError('Error al crear: ' + insertError.message);
        setLoading(false);
        return;
      }

      if (!newCustomer) {
        setError('No se pudo crear la cuenta. Probá de nuevo.');
        setLoading(false);
        return;
      }

      setCustomer(newCustomer);
      router.push(redirect);
    } catch (err: any) {
      setError('Error inesperado: ' + (err.message || 'Desconocido'));
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
            Crear cuenta
          </h1>
          <p className="text-stone-600 mt-2">Unite a la familia ADDANI</p>
        </div>

        <div className="bg-white rounded-2xl shadow-elegant-xl border border-rose-100 p-7">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-medium">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                Nombre completo *
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-3 bg-rose-50/30 border border-rose-100 rounded-xl text-stone-900 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                placeholder="María González"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                DNI *
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value.replace(/\D/g, '') })}
                className="w-full px-4 py-3 bg-rose-50/30 border border-rose-100 rounded-xl text-stone-900 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                placeholder="40123456"
                autoComplete="username"
              />
              <p className="text-xs text-stone-500 mt-1">Vas a ingresar con tu DNI y contraseña</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                WhatsApp *
              </label>
              <input
                type="tel"
                inputMode="numeric"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                className="w-full px-4 py-3 bg-rose-50/30 border border-rose-100 rounded-xl text-stone-900 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                placeholder="3624000000"
              />
              <p className="text-xs text-stone-500 mt-1">Te avisamos por WhatsApp cuando esté tu pedido</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 bg-rose-50/30 border border-rose-100 rounded-xl text-stone-900 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-rose-600 p-1"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                Repetir contraseña *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 bg-rose-50/30 border border-rose-100 rounded-xl text-stone-900 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white py-3.5 rounded-xl font-bold shadow-elegant-lg disabled:opacity-50"
            >
              {loading ? 'Creando cuenta...' : 'Crear mi cuenta'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-rose-100 text-center">
            <p className="text-sm text-stone-600">
              ¿Ya tenés cuenta?{' '}
              <Link href="/login" className="text-rose-700 hover:text-rose-800 font-semibold">
                Iniciá sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
