import Link from 'next/link';
import { createClient } from '@/utils/supabase-server';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  // If user is already logged in, redirect to panel
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/panel');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-orange-500/30">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
            <span className="text-lg font-bold tracking-tight text-white">ITIRIUM</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Iniciar sesión
            </Link>
            <Link href="/registro" className="text-sm font-medium bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-full transition-colors">
              Empezar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 sm:pt-40 sm:pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-400 text-xs font-medium px-3 py-1 rounded-full mb-8 border border-orange-500/20">
            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
            Sin tarjeta de crédito · Cancelá cuando quieras
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6 text-white text-balance">
            El CRM simple para<br />
            <span className="text-orange-500">
              negocios que crecen
            </span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed text-balance">
            Registrá clientes, controlá ventas y tomá decisiones con datos reales. Sin complicaciones.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/registro" className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-8 py-3.5 rounded-full text-base transition-colors w-full sm:w-auto">
              Empezar gratis 14 días
            </Link>
            <Link href="/login" className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-medium px-8 py-3.5 rounded-full text-base transition-colors border border-white/10 w-full sm:w-auto">
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-black/50 p-8 rounded-2xl border border-white/10 hover:border-orange-500/50 transition-colors">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white mb-6">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Clientes organizados</h3>
              <p className="text-zinc-400 leading-relaxed">
                Ficha completa, historial de compras, etiquetas personalizadas y contacto por WhatsApp con un clic.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-black/50 p-8 rounded-2xl border border-white/10 hover:border-orange-500/50 transition-colors">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white mb-6">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Ventas en tiempo real</h3>
              <p className="text-zinc-400 leading-relaxed">
                Registrá cada venta en segundos. Mantené el control total de tus ingresos y exportá todo a CSV.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-black/50 p-8 rounded-2xl border border-white/10 hover:border-orange-500/50 transition-colors">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white mb-6">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Métricas que importan</h3>
              <p className="text-zinc-400 leading-relaxed">
                Visualizá tu facturación, conocé tu ticket promedio y descubrí las tendencias de tu negocio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 border-t border-white/5 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-lg mx-auto relative z-10">
          <div className="bg-[#0f0f0f] rounded-3xl border border-white/10 p-10 overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 right-0 py-1.5 px-4 bg-orange-500/10 text-orange-400 text-xs font-semibold rounded-bl-xl border-l border-b border-orange-500/20">
              14 DÍAS GRATIS
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Plan Pro</h2>
            <div className="flex items-end gap-1 mb-8">
              <span className="text-5xl font-extrabold tracking-tight text-white">$8.990</span>
              <span className="text-zinc-500 text-sm font-medium mb-1"> ARS / mes</span>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                'Clientes ilimitados',
                'Ventas ilimitadas',
                'Cotizaciones con PDF',
                'Inventario de productos',
                'Métricas y estadísticas',
                'Exportación CSV',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-zinc-300">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500 shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                  {feature}
                </li>
              ))}
            </ul>

            <Link href="/registro" className="block w-full bg-white hover:bg-zinc-200 text-black font-semibold py-3.5 rounded-full transition-colors text-center mb-4">
              Empezar gratis
            </Link>
            <p className="text-center text-xs text-zinc-500">Sin tarjeta. Sin permanencia.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
            <span className="text-sm font-bold tracking-tight">ITIRIUM</span>
          </div>
          <p className="text-sm text-zinc-500 text-center sm:text-right">
            © {new Date().getFullYear()} ITIRIUM · Hecho para negocios argentinos
          </p>
        </div>
      </footer>
    </div>
  );
}
