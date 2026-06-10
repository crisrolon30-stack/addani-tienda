import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-rose-50/50 border-t border-rose-100 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-rose-700 rounded-xl flex items-center justify-center shadow-elegant">
                <span className="text-white font-serif font-bold text-lg">A</span>
              </div>
              <div>
                <p className="font-serif font-bold text-xl text-rose-900 leading-none">ADDANI</p>
                <p className="text-[10px] text-rose-700/60 tracking-widest uppercase mt-0.5">Polirrubro</p>
              </div>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed">
              Maquillaje, bijouterie, ropa interior y más. Calidad a tu alcance en Resistencia, Chaco.
            </p>
          </div>

          <div>
            <p className="font-semibold text-rose-900 text-sm uppercase tracking-wider mb-3">Navegación</p>
            <div className="space-y-2">
              <Link href="/" className="block text-sm text-stone-600 hover:text-rose-700">Inicio</Link>
              <Link href="/catalogo" className="block text-sm text-stone-600 hover:text-rose-700">Catálogo</Link>
              <Link href="/contacto" className="block text-sm text-stone-600 hover:text-rose-700">Contacto</Link>
              <Link href="/terminos" className="block text-sm text-stone-600 hover:text-rose-700">Términos y condiciones</Link>
            </div>
          </div>

          <div>
            <p className="font-semibold text-rose-900 text-sm uppercase tracking-wider mb-3">Contacto</p>
            <div className="space-y-2 text-sm text-stone-600">
              <p>📍 Resistencia, Chaco</p>
              <p>🕒 Lun a Sab · 9-13hs / 17-21hs</p>
              <a href="https://wa.me/5493624522965" target="_blank" className="block text-rose-700 hover:text-rose-800 font-semibold">
                💬 WhatsApp directo
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-rose-100 mt-8 pt-6 text-center">
          <p className="text-xs text-stone-500">
            © {new Date().getFullYear()} ADDANI · Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  );
}