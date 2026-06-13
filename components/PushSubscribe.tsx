'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BODd-qbYg3G_KOSd7bnnJJsLhdjjR_--j9_2nu6YTFxfGRIQDTY2Pyg_508ZUQaH7R4UMLxVKRvOBv2Jt4TBVl0';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

type Props = {
  ticketCode: string;
  customerPhone?: string;
};

export default function PushSubscribe({ ticketCode, customerPhone }: Props) {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<'idle' | 'pending' | 'granted' | 'denied' | 'error'>('idle');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    setSupported(true);

    // Si ya dio permiso y está suscripto → silencio
    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        setStatus('granted');
        // Re-guardar por si cambió el ticket o expiró
        await saveSubscription(existing);
      } else if (Notification.permission === 'denied') {
        setStatus('denied');
      } else {
        // Verificar si ya lo descartó para este ticket
        const localKey = `push-dismissed-${ticketCode}`;
        if (localStorage.getItem(localKey)) setDismissed(true);
      }
    }).catch(() => {
      // SW no se pudo registrar, no rompemos nada
    });
  }, [ticketCode]);

  const saveSubscription = async (sub: PushSubscription) => {
    const json = sub.toJSON();
    if (!json.endpoint || !json.keys) return;

    await supabase.from('push_subscriptions').upsert({
      ticket_code: ticketCode,
      customer_phone: customerPhone,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: navigator.userAgent.slice(0, 200),
      last_used_at: new Date().toISOString(),
    }, { onConflict: 'endpoint' });
  };

  const subscribe = async () => {
    setStatus('pending');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'idle');
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await saveSubscription(sub);
      setStatus('granted');
    } catch (e) {
      console.error('Push subscribe error:', e);
      setStatus('error');
    }
  };

  const dismiss = () => {
    localStorage.setItem(`push-dismissed-${ticketCode}`, '1');
    setDismissed(true);
  };

  // No mostramos nada si:
  if (!supported) return null;
  if (status === 'granted') return null;
  if (status === 'denied') return null;
  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-br from-amber-50 to-rose-50 border-2 border-rose-200 rounded-xl p-4 my-4 shadow-elegant">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-rose-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif text-base text-rose-950 leading-tight">Recibí avisos del estado</p>
          <p className="font-sans text-xs text-stone-600 mt-1">
            Te notificamos cuando tu equipo esté listo, sin necesidad de WhatsApp.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={subscribe}
              disabled={status === 'pending'}
              className="bg-rose-900 hover:bg-rose-950 text-white text-xs font-medium tracking-wide uppercase px-4 py-2 rounded-sm transition-colors disabled:opacity-50"
            >
              {status === 'pending' ? 'Activando…' : 'Activar avisos'}
            </button>
            <button
              onClick={dismiss}
              className="text-stone-500 hover:text-stone-700 text-xs font-medium px-3 py-2"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
