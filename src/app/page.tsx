import Link from 'next/link';
import { createClient } from '@/utils/supabase-server';
import { redirect } from 'next/navigation';

// SVG Icons as components
const ChartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
);
const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const ZapIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
);
const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);

export default async function LandingPage() {
  // If user is already logged in, redirect to panel
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/panel');

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-200 dark:border-zinc-800 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
            </div>
            <span className="text-lg font-bold tracking-tight">ITIRIUM</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors px-4 py-2">
              Iniciar Sesión
            </Link>
            <Link href="/registro" className="text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors">
              Empezar Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 border border-orange-200 dark:border-orange-500/20">
            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
            14 días gratis · Sin tarjeta de crédito
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            El CRM simple para<br />
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              negocios que crecen
            </span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Gestioná clientes, registrá ventas y hacé seguimiento de tu negocio desde un solo lugar.
            Diseñado para talleres, peluquerías, ferreterías y todo tipo de comercio.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/registro" className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-all hover:-translate-y-0.5 shadow-lg shadow-orange-500/25">
              Empezar gratis →
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-all">
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Todo lo que necesitás para gestionar tu negocio</h2>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">Sin complicaciones. Sin curva de aprendizaje. Empezá a vender en minutos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 hover:border-orange-300 dark:hover:border-orange-500/30 transition-all">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 mb-5 group-hover:scale-110 transition-transform">
                <UsersIcon />
              </div>
              <h3 className="text-lg font-bold mb-2">Directorio de Clientes</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Base de datos completa con historial de compras, alertas de seguimiento y contacto rápido por WhatsApp.
              </p>
            </div>

            <div className="group bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 hover:border-orange-300 dark:hover:border-orange-500/30 transition-all">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 mb-5 group-hover:scale-110 transition-transform">
                <ChartIcon />
              </div>
              <h3 className="text-lg font-bold mb-2">Panel de Estadísticas</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Facturación mensual, ticket promedio, top clientes y productos más vendidos. Todo en tiempo real.
              </p>
            </div>

            <div className="group bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 hover:border-orange-300 dark:hover:border-orange-500/30 transition-all">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 mb-5 group-hover:scale-110 transition-transform">
                <ZapIcon />
              </div>
              <h3 className="text-lg font-bold mb-2">Carga Inteligente</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Subí facturas en PDF y la IA extrae los datos automáticamente. Registrá ventas en segundos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Un plan simple</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-12">Sin trucos. Todo incluido.</p>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
            <div className="text-sm font-semibold text-orange-500 mb-2">PLAN PRO</div>
            <div className="flex items-baseline justify-center gap-1 mb-6">
              <span className="text-5xl font-extrabold">${process.env.NEXT_PUBLIC_PRECIO_MENSUAL || '5.000'}</span>
              <span className="text-zinc-500 text-sm font-medium">/mes</span>
            </div>

            <ul className="space-y-3 text-left mb-8">
              {[
                'Clientes y ventas ilimitados',
                'Panel de estadísticas completo',
                'Carga de facturas con IA',
                'Presupuestos PDF profesionales',
                'Datos 100% aislados y seguros',
                'Soporte por WhatsApp',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="text-orange-500 flex-shrink-0"><CheckIcon /></span>
                  {feature}
                </li>
              ))}
            </ul>

            <Link href="/registro" className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors text-center">
              Empezar 14 días gratis
            </Link>
            <p className="text-xs text-zinc-400 mt-3">Sin tarjeta de crédito · Cancelá cuando quieras</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500 rounded-md flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
            </div>
            <span className="text-sm font-semibold">ITIRIUM</span>
          </div>
          <p className="text-xs text-zinc-400">© {new Date().getFullYear()} ITIRIUM. El CRM simple para negocios que crecen.</p>
        </div>
      </footer>
    </div>
  );
}
