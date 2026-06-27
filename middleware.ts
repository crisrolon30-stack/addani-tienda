import { NextRequest, NextResponse } from 'next/server';
import { storeFromHost } from './lib/stores';

// Resuelve la tienda por subdominio y la deja disponible para toda la app:
//  - header x-store  -> lo leen los server components (headers())
//  - cookie store    -> la leen los client components
// Por ahora NO cambia el contenido: el catalogo por sucursal se conecta
// en el paso 2. Esto es solo el cimiento del ruteo por marca.
export function middleware(req: NextRequest) {
  const host = req.headers.get('host');
  const store = storeFromHost(host);

  const res = NextResponse.next();
  res.headers.set('x-store', store.key);
  res.cookies.set('store', store.key, { path: '/', sameSite: 'lax' });
  return res;
}

export const config = {
  // corre en todo menos assets estaticos y archivos con extension
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
