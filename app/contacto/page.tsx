import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ContactoPage() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <p className="text-rose-700 font-semibold tracking-widest uppercase text-xs mb-2">Estamos para vos</p>
          <h1 className="font-serif text-5xl font-bold text-rose-900 tracking-tight">Contactanos</h1>
          <p className="text-stone-600 mt-3">Te respondemos en minutos</p>
        </div>

        <div className="space-y-4">
          <a href="https://wa.me/5493624522965" target="_blank" className="block bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 border border-emerald-200 rounded-2xl p-6 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl">
                💬
              </div>
              <div className="flex-1">
                <p className="font-serif text-xl font-bold text-emerald-900">WhatsApp</p>
                <p className="text-sm text-emerald-700">+54 9 362 452-2965</p>
                <p className="text-xs text-emerald-600 mt-1">Respuesta más rápida</p>
              </div>
              <span className="text-emerald-700">→</span>
            </div>
          </a>

          <div className="bg-white rounded-2xl shadow-elegant border border-rose-100 p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center text-2xl">📍</div>
              <div>
                <p className="font-serif text-xl font-bold text-rose-900">Nuestro local</p>
                <p className="text-sm text-stone-700">Resistencia, Chaco</p>
                <p className="text-xs text-stone-500 mt-1">Lun a Sab · 9-13hs / 17-21hs</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-elegant border border-rose-100 p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center text-2xl">📧</div>
              <div>
                <p className="font-serif text-xl font-bold text-rose-900">Email</p>
                <p className="text-sm text-stone-700">cris.rolon30@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}