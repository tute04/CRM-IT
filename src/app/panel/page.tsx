'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FastEntryBar from '@/components/FastEntryBar';
import ActionableTable from '@/components/ActionableTable';
import DashboardStats from '@/components/DashboardStats';
import CotizadorRapido from '@/components/CotizadorRapido';
import DirectorioClientes from '@/components/DirectorioClientes';
import { createClient } from '@/utils/supabase-client';
import { useNegocio } from '@/contexts/NegocioContext';
import { Cliente, Venta } from '@/types';
import Link from 'next/link';

export default function PanelPage() {
    const [tab, setTab] = useState<'OPERATIVO' | 'DIRECTORIO' | 'ESTADISTICAS'>('OPERATIVO');
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [timeFilter, setTimeFilter] = useState<'SEMANA' | 'MES'>('SEMANA');
    const [searchTerm, setSearchTerm] = useState('');

    const supabase = createClient();
    const router = useRouter();
    const { negocio, loading: negocioLoading, diasRestantes } = useNegocio();

    // Persist dark mode
    useEffect(() => {
        const saved = localStorage.getItem('itirium-dark-mode');
        if (saved !== null) {
            setIsDarkMode(saved === 'true');
        } else {
            setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('itirium-dark-mode', String(isDarkMode));
    }, [isDarkMode]);

    // Update page title dynamically
    useEffect(() => {
        if (negocio) {
            document.title = `${negocio.nombre} | ITIRIUM`;
        }
    }, [negocio]);

    useEffect(() => {
        if (!negocioLoading && negocio) {
            fetchData();

            const clientesSub = supabase.channel('public:clientes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => {
                    fetchData();
                }).subscribe();

            const ventasSub = supabase.channel('public:ventas')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas' }, () => {
                    fetchData();
                }).subscribe();

            return () => {
                supabase.removeChannel(clientesSub);
                supabase.removeChannel(ventasSub);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [negocioLoading, negocio]);

    const fetchData = async () => {
        const { data: cData } = await supabase.from('clientes').select('*');
        if (cData) {
            setClientes(cData.map(c => ({
                id: c.id,
                nombre: c.nombre,
                telefono: c.telefono
            })));
        }
        const { data: vData } = await supabase.from('ventas').select('*').order('fecha', { ascending: false });
        if (vData) {
            setVentas(vData.map(v => ({
                id: v.id,
                cliente_id: v.clienteId || v.cliente_id,
                fecha: v.fecha,
                detalle: v.detalleProducto || v.detalle_producto || v.detalle,
                monto: v.montoFacturado || v.monto_facturado || v.monto,
                vendedor: v.vendedor
            })));
        }
    };

    const handleAddData = async (c: Omit<Cliente, 'id'>) => {
        if (!negocio) return undefined;
        const { data, error } = await supabase.from('clientes').insert([{
            nombre: c.nombre,
            telefono: c.telefono,
            negocio_id: negocio.id,
        }]).select().single();

        if (error) {
            console.error("Error Supabase Clientes:", error);
            alert("Error al guardar cliente: " + error.message);
            return undefined;
        }
        if (data) {
            setClientes(prev => {
                if (!prev.find(existing => existing.id === data.id)) return [...prev, data];
                return prev;
            });
            return data.id as string;
        }
        return undefined;
    };

    const handleAddVenta = async (clienteId: string, detalleProducto: string, monto: number, vendedor: string) => {
        if (!negocio) return;
        const { data, error } = await supabase
            .from('ventas')
            .insert([{
                cliente_id: clienteId,
                detalle: detalleProducto,
                monto: parseFloat(monto.toString()),
                vendedor: vendedor,
                negocio_id: negocio.id,
            }])
            .select().single();

        if (error) {
            console.error("Error Supabase Ventas:", error);
            alert("Error al guardar la venta: " + error.message);
            return;
        }
        if (data) fetchData();
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const hoy = new Date();
    const getWeekStart = (d: Date) => { const date = new Date(d); const day = date.getDay(); const diff = date.getDate() - day + (day === 0 ? -6 : 1); return new Date(date.setDate(diff)).toISOString().split('T')[0]; };
    const getMonthStart = (d: Date) => { return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; };

    const startOfWeek = getWeekStart(hoy);
    const startOfMonth = getMonthStart(hoy);

    const ventasSemana = ventas.filter(v => v.fecha >= startOfWeek);
    const ventasMes = ventas.filter(v => v.fecha >= startOfMonth);

    const totalFacturadoSemana = ventasSemana.reduce((acc, v) => acc + (v.monto || 0), 0);
    const totalFacturadoMes = ventasMes.reduce((acc, v) => acc + (v.monto || 0), 0);

    const facturadoActual = timeFilter === 'SEMANA' ? totalFacturadoSemana : totalFacturadoMes;
    const cantidadVentasActual = timeFilter === 'SEMANA' ? ventasSemana.length : ventasMes.length;
    const ticketPromedio = cantidadVentasActual > 0 ? Math.round(facturadoActual / cantidadVentasActual) : 0;

    if (negocioLoading) {
        return (
            <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-400 font-medium text-sm">Cargando...</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { key: 'OPERATIVO', label: 'Panel de Ventas', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg> },
        { key: 'DIRECTORIO', label: 'Directorio', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, badge: clientes.length },
        { key: 'ESTADISTICAS', label: 'Estadísticas', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg> },
    ] as const;

    return (
        <div className={isDarkMode ? 'dark' : ''}>
            <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
                {/* Trial Banner */}
                {negocio?.plan === 'trial' && diasRestantes !== null && (
                    <div className="w-full bg-orange-500 px-4 py-2 text-center">
                        <span className="text-white/90 text-sm font-medium">
                            Período de prueba: {diasRestantes} {diasRestantes === 1 ? 'día' : 'días'} restantes
                        </span>
                        <span className="mx-2 text-white/30">·</span>
                        <Link href="/suscripcion" className="text-white text-sm font-bold hover:underline underline-offset-2">
                            Suscribirse →
                        </Link>
                    </div>
                )}

                <FastEntryBar
                    clientes={clientes}
                    ventas={ventas}
                    onAddData={handleAddData}
                    onAddServicio={handleAddVenta}
                    isDarkMode={isDarkMode}
                    setIsDarkMode={setIsDarkMode}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    negocioNombre={negocio?.nombre || 'Mi Negocio'}
                    onLogout={handleLogout}
                />

                {/* Tabs */}
                <div className="w-full bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 flex gap-1 justify-center">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key as typeof tab)}
                            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all border-b-2 ${tab === t.key
                                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                        >
                            {t.icon}
                            {t.label}
                            {'badge' in t && t.badge !== undefined && (
                                <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{t.badge}</span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
                    {/* Metric Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Clientes', value: clientes.length, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>, color: 'indigo' },
                            { label: `Facturado`, value: `$ ${facturadoActual.toLocaleString('es-AR')}`, sub: timeFilter === 'SEMANA' ? 'semana' : 'mes', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>, color: 'emerald', highlight: true },
                            { label: 'Ventas', value: cantidadVentasActual, sub: timeFilter === 'SEMANA' ? 'semana' : 'mes', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /></svg>, color: 'violet' },
                            { label: 'Ticket Prom.', value: `$ ${ticketPromedio.toLocaleString('es-AR')}`, sub: timeFilter === 'SEMANA' ? 'semana' : 'mes', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>, color: 'amber' },
                        ].map((card) => (
                            <div key={card.label} className="group bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-orange-300 dark:hover:border-orange-500/30 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color === 'indigo' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-500' :
                                        card.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' :
                                            card.color === 'violet' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500' :
                                                'bg-amber-50 dark:bg-amber-500/10 text-amber-500'
                                        }`}>{card.icon}</div>
                                    <div>
                                        <h3 className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                                            {card.label} {card.sub && <span className="text-zinc-400 dark:text-zinc-500 normal-case">({card.sub})</span>}
                                        </h3>
                                        <p className={`text-2xl font-bold ${card.highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-white'}`}>
                                            {card.value}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Time Filter */}
                    <div className="flex justify-end -mt-2">
                        <div className="flex gap-0.5 bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                            {(['SEMANA', 'MES'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setTimeFilter(f)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${timeFilter === f
                                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                        }`}
                                >
                                    {f === 'SEMANA' ? 'Esta Semana' : 'Este Mes'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {tab === 'OPERATIVO' ? (
                        <ActionableTable ventas={ventas} clientes={clientes} searchTerm={searchTerm} />
                    ) : tab === 'DIRECTORIO' ? (
                        <DirectorioClientes clientes={clientes} ventas={ventas} searchTerm={searchTerm} />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <DashboardStats ventas={ventas} clientes={clientes} />
                            </div>
                            <div className="lg:col-span-1">
                                <CotizadorRapido clientes={clientes} negocioNombre={negocio?.nombre} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="text-center py-4 text-xs text-zinc-400 dark:text-zinc-600">
                    {negocio?.nombre || 'Mi Negocio'} · Powered by <span className="font-semibold">ITIRIUM</span>
                </footer>
            </main>
        </div>
    );
}
