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

          {/* Mobile hamburger menu (visual only for static RSC) */}
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
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-orange-500/10 blur-[150px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">

            {/* Left: Text */}
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

            {/* Right: Mockup */}
            <div className="order-2 lg:order-2 w-full max-w-2xl mx-auto lg:max-w-none relative animate-fade-in-up">
              <div className="relative group perspective">
                <div className="transform lg:-rotate-1 lg:hover:rotate-0 transition-transform duration-700 ease-out">
                  <BrowserFrame url="app.itrium.com/panel" className="h-[400px] sm:h-[500px] w-full bg-[#111]">
                    <div className="relative w-full h-full">
                      <Image
                        src="/screenshots/dashboard.png"
                        alt="ITrium Dashboard"
                        fill
                        className="object-cover object-left-top"
                        unoptimized
                        priority
                      />
                    </div>
                  </BrowserFrame>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. SOCIAL PROOF BAR */}
        <section className="bg-[#111111] border-y border-white/5 py-8">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-6">
              Usado por negocios de todo el país
            </p>

            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 text-zinc-400 font-medium text-sm sm:text-base">
              <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                Talleres mecánicos
              </div>
              <span className="hidden sm:inline opacity-30">·</span>
              <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 10a2 2 0 0 0-2 2c0 1.1.9 2 2 2s2-.9 2-2a2 2 0 0 0-2-2Z" /><path d="M12 21a9 9 0 0 1-9-9c0-5 2.5-9 9-9s9 4 9 9a9 9 0 0 1-9 9Z" /><path d="M12 6a4 4 0 0 0-4 4" /></svg>
                Veterinarias
              </div>
              <span className="hidden md:inline opacity-30">·</span>
              <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m14.5 14.5-5-5" /><path d="m5 5 2.5 2.5" /><path d="M18 18h.01" /><path d="M7.5 16.5 6 18c-... " /><circle cx="16.5" cy="7.5" r="2.5" /><circle cx="7.5" cy="16.5" r="2.5" /></svg>
                Peluquerías
              </div>
              <span className="hidden sm:inline opacity-30">·</span>
              <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>
                Ferreterías
              </div>
            </div>
          </div>
        </section>

        {/* 4. FEATURES CON SCREENSHOTS */}
        <section id="caracteristicas" className="py-24 sm:py-32 overflow-hidden scroll-mt-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20 sm:mb-32">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
                Todo lo que necesitás en un solo lugar
              </h2>
              <p className="text-lg md:text-xl text-zinc-400">
                Sin curva de aprendizaje. Si sabés usar WhatsApp, sabés usar ITrium.
              </p>
            </div>

            <div className="space-y-32">
              {/* Feature 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                <div className="order-2 lg:order-1 relative group perspective">
                  <div className="transform rotate-1 lg:group-hover:rotate-0 transition-transform duration-700 ease-out">
                    <BrowserFrame url="app.itrium.com/panel" className="h-[350px] sm:h-[450px]">
                      <div className="relative w-full h-full bg-[#111]">
                        <Image src="/screenshots/dashboard.png" alt="Dashboard" fill unoptimized className="object-cover object-left-top" />
                      </div>
                    </BrowserFrame>
                  </div>
                </div>
                <div className="order-1 lg:order-2 flex flex-col justify-center">
                  <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center mb-6 border border-orange-500/20">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">Tu negocio de un vistazo</h3>
                  <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
                    Métricas en tiempo real, gráfico de facturación, ranking de clientes y alertas automáticas. Todo lo que necesitás para tomar decisiones sin perder tiempo.
                  </p>
                  <ul className="space-y-4 text-zinc-300">
                    {['Facturación por semana, mes y año', 'Top 5 clientes por volumen', 'Alertas de clientes inactivos'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-orange-500 shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                        <span className="font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                <div className="flex flex-col justify-center">
                  <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center mb-6 border border-orange-500/20">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">Conocé a cada cliente</h3>
                  <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
                    Ficha completa con historial de compras, etiquetas personalizables y contacto directo por WhatsApp con un clic.
                  </p>
                  <ul className="space-y-4 text-zinc-300">
                    {['Historial completo de ventas', 'Etiquetas: VIP, Frecuente, Moroso', 'WhatsApp directo desde la ficha'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-orange-500 shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                        <span className="font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="relative group perspective">
                  <div className="transform -rotate-1 lg:group-hover:rotate-0 transition-transform duration-700 ease-out">
                    <BrowserFrame url="app.itrium.com/panel/clientes" className="h-[350px] sm:h-[450px]">
                      <div className="relative w-full h-full bg-[#111]">
                        <Image src="/screenshots/clientes.png" alt="Módulo de Clientes" fill unoptimized className="object-cover object-left-top" />
                      </div>
                    </BrowserFrame>
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                <div className="order-2 lg:order-1 relative group perspective">
                  <div className="transform rotate-1 lg:group-hover:rotate-0 transition-transform duration-700 ease-out">
                    <BrowserFrame url="app.itrium.com/panel/ventas" className="h-[350px] sm:h-[450px]">
                      <div className="relative w-full h-full bg-[#111]">
                        <Image src="/screenshots/ventas.png" alt="Módulo de Ventas" fill unoptimized className="object-cover object-left-top" />
                      </div>
                    </BrowserFrame>
                  </div>
                </div>
                <div className="order-1 lg:order-2 flex flex-col justify-center">
                  <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center mb-6 border border-orange-500/20">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v8" /><path d="M8 12h8" /></svg>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">Registrá ventas en segundos</h3>
                  <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
                    Cargá una venta, asignala a un cliente y marcá si está cobrada o pendiente. Exportá todo a CSV cuando quieras.
                  </p>
                  <ul className="space-y-4 text-zinc-300">
                    {['Estados: Cobrada, Pendiente, Cancelada', 'Filtros por fecha y vendedor', 'Exportación a CSV con un clic'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-orange-500 shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                        <span className="font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                <div className="flex flex-col justify-center">
                  <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center mb-6 border border-orange-500/20">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">Nunca más olvidés un seguimiento</h3>
                  <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
                    Recordatorios automáticos de clientes inactivos y tareas pendientes para que no se te escape nada importante.
                  </p>
                  <ul className="space-y-4 text-zinc-300">
                    {['Alertas de clientes sin actividad', 'Lista de tareas diarias', 'Estado del plan visible siempre'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-orange-500 shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                        <span className="font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="relative group perspective">
                  <div className="transform -rotate-1 lg:group-hover:rotate-0 transition-transform duration-700 ease-out">
                    <BrowserFrame url="app.itrium.com/panel/alertas" className="h-[350px] sm:h-[450px]">
                      <div className="relative w-full h-full bg-[#111]">
                        <Image src="/screenshots/alertas.png" alt="Módulo de Alertas" fill unoptimized className="object-cover object-left-top" />
                      </div>
                    </BrowserFrame>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 5. PRECIOS */}
        <section id="precios" className="py-24 sm:py-32 bg-[#111111] border-y border-white/5 scroll-mt-16 relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-4xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
                Un precio simple.<br />Sin sorpresas.
              </h2>
              <p className="text-lg text-zinc-400">
                Sin planes confusos. Sin cobros ocultos. Un solo plan que incluye todo.
              </p>
            </div>

            <div className="max-w-md mx-auto relative group">
              {/* Outer glow aura */}
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

              <div className="relative bg-[#0a0a0a] rounded-3xl border border-orange-500/50 p-10 shadow-[0_0_30px_rgba(249,115,22,0.1)]">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.5)]">
                  MÁS POPULAR
                </div>

                <div className="text-center mt-4">
                  <h3 className="text-2xl font-bold text-white mb-2">Plan Pro</h3>
                  <div className="flex flex-col items-center justify-center mb-6">
                    <span className="text-6xl font-extrabold tracking-tight text-white mb-2">$8.990</span>
                    <span className="text-zinc-500 text-sm font-medium uppercase tracking-wider">ARS por mes · IVA incluido</span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-xs font-semibold mb-8">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    14 días gratis para empezar
                  </div>
                </div>

                <div className="w-full h-px bg-white/10 mb-8" />

                <ul className="space-y-4 mb-10">
                  {[
                    'Clientes ilimitados',
                    'Ventas ilimitadas',
                    'Cotizaciones con PDF',
                    'Inventario de productos',
                    'Alertas y recordatorios',
                    'Exportación CSV',
                    'Soporte por WhatsApp',
                    'Actualizaciones incluidas'
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-zinc-300 font-medium">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-orange-500 shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link href="/registro" className="flex items-center justify-center w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-orange-500/25 mb-4 text-base">
                  Empezar 14 días gratis
                </Link>
                <p className="text-center text-xs text-zinc-500 font-medium">
                  Sin tarjeta. Cancelá cuando quieras.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. TESTIMONIO */}
        <section className="py-24 sm:py-32">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <svg className="w-16 h-16 text-orange-500/20 mx-auto mb-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21L16.09 13.149H11.45V3H21.45V13.149L19.49 21H14.017ZM3.812 21L5.885 13.149H1.245V3H11.245V13.149L9.284 21H3.812Z" />
            </svg>
            <p className="text-2xl sm:text-4xl text-white font-semibold leading-snug mb-10 text-balance">
              "Desde que uso ITrium sé exactamente cuánto facturé, quiénes son mis mejores clientes y qué tengo pendiente. Antes todo eso lo manejaba por WhatsApp."
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg">
                C
              </div>
              <div className="text-left">
                <p className="font-bold text-white text-lg">Carlos M.</p>
                <p className="text-zinc-500">Taller mecánico, Córdoba</p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. CTA FINAL */}
        <section className="bg-[#111111] py-24 sm:py-32 border-t border-white/5">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight mb-6 text-balance">
              Empezá hoy.<br /><span className="text-orange-500">Son 14 días gratis.</span>
            </h2>
            <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto text-balance">
              Sin tarjeta de crédito. Sin permanencia. Solo tu negocio funcionando mejor.
            </p>
            <div className="flex flex-col items-center gap-6">
              <Link href="/registro" className="inline-flex items-center justify-center bg-white hover:bg-zinc-200 text-black font-bold px-10 py-4 rounded-full transition-colors text-lg w-full sm:w-auto">
                Crear mi cuenta gratis
              </Link>
              <p className="text-sm font-medium text-zinc-500">
                Más de 50 negocios ya lo usan · Soporte en español
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 8. FOOTER */}
      <footer className="py-12 px-6 border-t border-white/10 relative z-10 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto flex flex-col items-center sm:items-start gap-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between w-full gap-6">
            <div className="flex flex-col items-center sm:items-start gap-4">
              <Logo size="md" variant="dark" />
              <div className="flex items-center gap-6 text-sm font-medium text-zinc-400">
                <Link href="#caracteristicas" className="hover:text-white transition-colors">Características</Link>
                <Link href="#precios" className="hover:text-white transition-colors">Precios</Link>
                <Link href="/login" className="hover:text-white transition-colors">Iniciar sesión</Link>
              </div>
            </div>

            <p className="text-sm text-zinc-500 font-medium text-center sm:text-right">
              © {new Date().getFullYear()} ITrium · Hecho para negocios argentinos
            </p>
          </div>

          <div className="w-full text-center sm:text-left mt-4">
            <p className="text-[11px] text-zinc-600 max-w-xl">
              ITrium no es un producto de ninguna empresa internacional. Es local, es nuestro.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
