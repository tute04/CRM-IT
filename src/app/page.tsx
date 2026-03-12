import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase-server';
import { redirect } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import BrowserFrame from '@/components/ui/BrowserFrame';

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/panel');
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-orange-500/30 overflow-x-hidden scroll-smooth">
      {/* 1. NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-md border-b border-white/10 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="shrink-0">
              <Logo size="md" variant="dark" />
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
              <Link href="#caracteristicas" className="hover:text-white transition-colors">Características</Link>
              <Link href="#precios" className="hover:text-white transition-colors">Precios</Link>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Iniciar sesión
            </Link>
            <Link href="/registro" className="text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-full transition-colors shadow-[0_0_15px_rgba(249,115,22,0.3)]">
              Empezar gratis
            </Link>
          </div>

          <button className="md:hidden text-zinc-400 hover:text-white p-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </nav>

      <main className="pt-16">
        {/* 2. HERO */}
        <section className="relative px-6 pt-20 pb-20 lg:pt-32 lg:pb-32 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-orange-500/10 blur-[150px] rounded-full pointer-events-none" />
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">
            <div className="flex flex-col items-start text-left order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm font-medium text-zinc-300 mb-8 backdrop-blur-sm">
                <span className="text-orange-500">✦</span> Nuevo · CRM para negocios argentinos
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 text-white text-balance">
                Organizá tu negocio.<br />
                <span className="text-orange-500">Crecé con datos reales.</span>
              </h1>
              <p className="text-lg sm:text-xl text-zinc-400 mb-10 leading-relaxed text-balance max-w-xl">
                ITrium es el CRM simple que necesitás para gestionar clientes, controlar ventas y tomar decisiones inteligentes. Sin complicaciones, sin Excel, sin caos.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <Link href="/registro" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3.5 rounded-full transition-colors text-base shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                  Empezar gratis 14 días
                </Link>
                <Link href="#caracteristicas" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent text-white border border-white/20 hover:bg-white/5 font-medium px-8 py-3.5 rounded-full transition-colors text-base">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  Ver demo
                </Link>
              </div>
              <p className="mt-8 text-sm text-zinc-500 font-medium">
                Sin tarjeta de crédito · Cancelá cuando quieras · Soporte en español
              </p>
            </div>
            <div className="order-2 lg:order-2 w-full max-w-2xl mx-auto lg:max-w-none relative animate-fade-in-up">
              <BrowserFrame url="app.itrium.com/panel" className="h-[400px] sm:h-[500px] w-full bg-[#111]">
                <div className="relative w-full h-full">
                  <Image src="/screenshots/dashboard.png" alt="ITrium Dashboard" fill className="object-cover object-left-top" unoptimized priority />
                </div>
              </BrowserFrame>
            </div>
          </div>
        </section>

        {/* 3. SOCIAL PROOF BAR */}
        <section className="bg-[#111111] border-y border-white/5 py-8">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-6">Usado por negocios de todo el país</p>
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 text-zinc-400 font-medium text-sm sm:text-base">
              <span>Talleres mecánicos</span> · <span>Veterinarias</span> · <span>Peluquerías</span> · <span>Ferreterías</span>
            </div>
          </div>
        </section>

        {/* NUEVA SECCIÓN: AI FEATURE HIGHLIGHT */}
        <section className="py-20 relative overflow-hidden bg-gradient-to-b from-transparent to-orange-500/5">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="bg-[#111] border border-orange-500/30 rounded-3xl p-8 md:p-12 max-w-5xl mx-auto shadow-[0_0_50px_rgba(249,115,22,0.1)]">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-500 text-xs font-bold uppercase tracking-wider mb-6">
                Tecnología Exclusiva
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
                No más carga manual.<br />
                <span className="text-orange-500">Nuestra IA trabaja por vos.</span>
              </h2>
              <p className="text-lg md:text-xl text-zinc-400 mb-10 leading-relaxed max-w-3xl mx-auto">
                Sacale una foto a cualquier factura y el CRM extraerá automáticamente el nombre del cliente, los productos y el monto total en segundos.
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                <div className="flex items-center gap-3 text-zinc-200 bg-white/5 border border-white/10 px-6 py-3 rounded-full">
                  <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 text-xs">✓</div>
                  <span className="font-semibold">Escaneo AFIP automático</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-200 bg-white/5 border border-white/10 px-6 py-3 rounded-full">
                  <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 text-xs">✓</div>
                  <span className="font-semibold">Carga a inventario sin tipeo</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. FEATURES CON SCREENSHOTS */}
        <section id="caracteristicas" className="py-24 sm:py-32 overflow-hidden scroll-mt-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6">Todo lo que necesitás</h2>
              <p className="text-lg text-zinc-400">Sin curva de aprendizaje. Si sabés usar WhatsApp, sabés usar ITrium.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-32">
               <BrowserFrame url="app.itrium.com/panel" className="h-[350px]"><Image src="/screenshots/dashboard.png" alt="Dashboard" fill unoptimized className="object-cover" /></BrowserFrame>
               <div>
                 <h3 className="text-3xl font-bold text-white mb-4">Tu negocio de un vistazo</h3>
                 <p className="text-lg text-zinc-400 mb-6">Métricas en tiempo real para tomar decisiones sin perder tiempo.</p>
                 <ul className="space-y-4 text-zinc-300">
                   <li>✓ Facturación por semana, mes y año</li>
                   <li>✓ Top 5 clientes por volumen</li>
                 </ul>
               </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-32">
               <div className="order-2 lg:order-1">
                 <h3 className="text-3xl font-bold text-white mb-4">Conocé a cada cliente</h3>
                 <p className="text-lg text-zinc-400 mb-6">Ficha completa con historial y contacto directo por WhatsApp.</p>
                 <ul className="space-y-4 text-zinc-300">
                   <li>✓ Historial completo de ventas</li>
                   <li>✓ WhatsApp directo desde la ficha</li>
                 </ul>
               </div>
               <BrowserFrame url="app.itrium.com/clientes" className="h-[350px] order-1 lg:order-2"><Image src="/screenshots/clientes.png" alt="Clientes" fill unoptimized className="object-cover" /></BrowserFrame>
            </div>
          </div>
        </section>

        {/* 5. PRECIOS */}
        <section id="precios" className="py-24 bg-[#111] border-y border-white/5 scroll-mt-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-extrabold text-white mb-16">Un precio simple.</h2>
            <div className="max-w-md mx-auto bg-[#0a0a0a] rounded-3xl border border-orange-500/50 p-10 shadow-2xl">
              <h3 className="text-2xl font-bold text-zinc-400 mb-4">Plan Pro</h3>
              <div className="text-6xl font-extrabold text-white mb-2">$8.990</div>
              <p className="text-zinc-500 mb-8">ARS por mes · IVA incluido</p>
              <ul className="text-left space-y-4 mb-10 text-zinc-300">
                <li>✓ Clientes y Ventas ilimitadas</li>
                <li>✓ Cotizaciones con PDF</li>
                <li>✓ IA de Escaneo de facturas</li>
                <li>✓ Soporte por WhatsApp</li>
              </ul>
              <Link href="/registro" className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg">Empezar 14 días gratis</Link>
            </div>
          </div>
        </section>

        <section className="py-24 bg-orange-500 text-center">
           <h2 className="text-4xl font-extrabold text-black mb-6">¿Listo para transformar tu negocio?</h2>
           <Link href="/registro" className="inline-block bg-black text-white font-bold px-10 py-4 rounded-full text-lg">Probar gratis ahora</Link>
        </section>
      </main>

      <footer className="py-12 px-6 border-t border-white/10 bg-[#0a0a0a] text-center">
        <Logo size="md" variant="dark" className="mx-auto mb-6" />
        <p className="text-sm text-zinc-500">© {new Date().getFullYear()} ITrium · Hecho para negocios argentinos</p>
      </footer>

      {/* BOTÓN FLOTANTE DE WHATSAPP */}
      <a 
        href="https://wa.me/5493515446715" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[100] bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center gap-2 group"
      >
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-500 font-bold ml-0 group-hover:ml-2">
          ¿Dudas? Chateamos
        </span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412 0 6.556-5.338 11.892-11.893 11.892-1.997-.001-3.956-.5-5.715-1.448l-6.782 1.776zm6.292-3.732l.303.18c1.554.919 3.326 1.403 5.14 1.405 5.585 0 10.126-4.544 10.129-10.129.002-2.706-1.051-5.251-2.964-7.165-1.913-1.913-4.459-2.964-7.165-2.966-5.588 0-10.129 4.544-10.132 10.131-.001 1.887.524 3.727 1.516 5.303l-.203.743-.728 2.656 2.712-.71z" />
        </svg>
      </a>
    </div>
  );
}
