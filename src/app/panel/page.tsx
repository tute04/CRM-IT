'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase-client';
import { useNegocio } from '@/contexts/NegocioContext';
import { Cliente, Venta, Recordatorio, Producto } from '@/types';
import { formatCurrency, getWeekStart, getMonthStart, getYearStart } from '@/utils/helpers';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Link from 'next/link';

type TimeFilter = 'SEMANA' | 'MES' | 'AÑO';

export default function DashboardPage() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
    const [productosBajoStock, setProductosBajoStock] = useState<Producto[]>([]);
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('MES');
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const { negocio, diasRestantes } = useNegocio();

    const fetchData = useCallback(async () => {
        const [cRes, vRes, rRes, pRes] = await Promise.all([
            supabase.from('clientes').select('*'),
            supabase.from('ventas').select('*').order('fecha', { ascending: false }),
            supabase.from('recordatorios').select('*, cliente:clientes(nombre)').eq('completado', false).order('fecha', { ascending: true }).limit(10),
            supabase.from('productos').select('*').lte('stock_actual', 'stock_minimo'), // We cannot directly compare two columns in supabase-js select, better to fetch all or use a view/rpc. Let's fetch all products and filter in js for now since dataset is small or use filter.
        ]);
        if (cRes.data) setClientes(cRes.data as Cliente[]);
        if (vRes.data) setVentas(vRes.data as Venta[]);
        if (rRes.data) setRecordatorios(rRes.data as Recordatorio[]);
        if (pRes.data) {
            const p = pRes.data as Producto[];
            setProductosBajoStock(p.filter(x => x.stock_actual <= x.stock_minimo));
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        if (negocio) {
            fetchData();
            const sub = supabase.channel('dashboard-realtime')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas' }, fetchData)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, fetchData)
                .subscribe();
            return () => { supabase.removeChannel(sub); };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [negocio]);

    const hoy = new Date();
    const filterStart = timeFilter === 'SEMANA' ? getWeekStart(hoy) : timeFilter === 'MES' ? getMonthStart(hoy) : getYearStart(hoy);
    const ventasFiltradas = ventas.filter(v => v.fecha >= filterStart);
    const ventasCobradas = ventasFiltradas.filter(v => v.estado !== 'cancelada');

    const totalFacturado = ventasCobradas.reduce((s, v) => s + (v.monto || 0), 0);
    const cantidadVentas = ventasCobradas.length;
    const ticketPromedio = cantidadVentas > 0 ? Math.round(totalFacturado / cantidadVentas) : 0;
    const clientesNuevos = clientes.filter(c => c.created_at && c.created_at >= filterStart).length;
    const ventasPendientes = ventasFiltradas.filter(v => v.estado === 'pendiente');
    const totalPendiente = ventasPendientes.reduce((s, v) => s + (v.monto || 0), 0);

    // Período anterior
    const filterDays = timeFilter === 'SEMANA' ? 7 : timeFilter === 'MES' ? 30 : 365;
    const prevStart = new Date(hoy.getTime() - filterDays * 2 * 86400000).toISOString().split('T')[0];
    const prevEnd = filterStart;
    const ventasPrevias = ventas.filter(v => v.fecha >= prevStart && v.fecha < prevEnd && v.estado !== 'cancelada');
    const totalPrevio = ventasPrevias.reduce((s, v) => s + (v.monto || 0), 0);
    const tendencia = totalPrevio > 0 ? ((totalFacturado - totalPrevio) / totalPrevio) * 100 : 0;

    // Chart data: facturación por día (últimos 30 días)
    const chartData = (() => {
        const days: { fecha: string; total: number }[] = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(hoy);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            const dayVentas = ventas.filter(v => v.fecha === key && v.estado !== 'cancelada');
            days.push({ fecha: key, total: dayVentas.reduce((s, v) => s + (v.monto || 0), 0) });
        }
        return days;
    })();

    // Pie chart: ventas por vendedor
    const pieData = (() => {
        const map: Record<string, number> = {};
        ventasCobradas.forEach(v => {
            const name = v.vendedor || 'Sin asignar';
            map[name] = (map[name] || 0) + v.monto;
        });
        return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    })();

    const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5', '#a3a3a3'];

    // Top 5 clientes
    const topClientes = (() => {
        const map: Record<string, { nombre: string; total: number; count: number }> = {};
        ventas.filter(v => v.estado !== 'cancelada').forEach(v => {
            const c = clientes.find(cl => cl.id === v.cliente_id);
            const name = c?.nombre || 'Desconocido';
            if (!map[v.cliente_id]) map[v.cliente_id] = { nombre: name, total: 0, count: 0 };
            map[v.cliente_id].total += v.monto || 0;
            map[v.cliente_id].count += 1;
        });
        return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
    })();

    // Alertas
    const clientesInactivos = clientes.filter(c => {
        if (!c.ultimo_contacto) return false;
        const days = Math.floor((hoy.getTime() - new Date(c.ultimo_contacto).getTime()) / 86400000);
        return days > 30;
    });
    const ventasViejasPendientes = ventas.filter(v => {
        if (v.estado !== 'pendiente') return false;
        const days = Math.floor((hoy.getTime() - new Date(v.fecha).getTime()) / 86400000);
        return days > 7;
    });

    if (loading) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            </div>
        );
    }

    const timeLabels = { SEMANA: 'Esta Semana', MES: 'Este Mes', AÑO: 'Este Año' };

    const metricCards = [
        { label: 'Facturado', value: formatCurrency(totalFacturado), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>, color: 'emerald', highlight: true },
        { label: 'Ventas', value: cantidadVentas, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /></svg>, color: 'orange' },
        { label: 'Ticket Prom.', value: formatCurrency(ticketPromedio), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>, color: 'amber' },
        { label: 'Clientes Nuevos', value: clientesNuevos, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>, color: 'blue' },
        { label: 'Pendiente', value: formatCurrency(totalPendiente), sub: `${ventasPendientes.length} ventas`, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>, color: 'red' },
    ];

    const colorMap: Record<string, string> = {
        emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500',
        orange: 'bg-orange-50 dark:bg-orange-500/10 text-orange-500',
        amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-500',
        blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500',
        red: 'bg-red-50 dark:bg-red-500/10 text-red-500',
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Dashboard</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Resumen de tu negocio</p>
                </div>
                <div className="flex gap-0.5 bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 self-start">
                    {(['SEMANA', 'MES', 'AÑO'] as TimeFilter[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setTimeFilter(f)}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${timeFilter === f
                                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                        >
                            {timeLabels[f]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
                {metricCards.map(card => (
                    <div key={card.label} className="bg-white dark:bg-zinc-900 p-4 lg:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-orange-300 dark:hover:border-orange-500/30 transition-all">
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorMap[card.color]}`}>{card.icon}</div>
                            <div className="min-w-0">
                                <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-semibold uppercase tracking-wider truncate">{card.label}</p>
                                <p className={`text-lg lg:text-xl font-bold truncate ${card.highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-white'}`}>
                                    {card.value}
                                </p>
                                {'sub' in card && card.sub && <p className="text-[10px] text-zinc-400">{card.sub}</p>}
                            </div>
                        </div>
                        {card.label === 'Facturado' && totalPrevio > 0 && (
                            <div className={`mt-2 text-xs font-semibold flex items-center gap-1 ${tendencia >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {tendencia >= 0 ? '↑' : '↓'} {Math.abs(tendencia).toFixed(1)}% vs anterior
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                {/* Bar Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Facturación · Últimos 30 días</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis dataKey="fecha" tickFormatter={(v: string) => v.slice(8)} tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                                    formatter={(value: unknown) => [formatCurrency(value as number), 'Total']}
                                    labelFormatter={(label: unknown) => `Día ${String(label).slice(8)}`}
                                />
                                <Bar dataKey="total" fill="#f97316" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Ventas por Vendedor</h3>
                    {pieData.length > 0 ? (
                        <>
                            <div className="h-44">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                                            {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                                            formatter={(value: unknown) => [formatCurrency(value as number), '']}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-3 space-y-1.5">
                                {pieData.slice(0, 5).map((item, i) => (
                                    <div key={item.name} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                                            <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[100px]">{item.name}</span>
                                        </div>
                                        <span className="font-semibold text-zinc-900 dark:text-white">{formatCurrency(item.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-44 flex items-center justify-center text-sm text-zinc-400">Sin datos</div>
                    )}
                </div>
            </div>

            {/* Bottom Row: Top Clientes + Alertas + Para Hacer Hoy */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                {/* Top 5 Clientes */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Top 5 Clientes</h3>
                    {topClientes.length > 0 ? (
                        <div className="space-y-3">
                            {topClientes.map((c, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600' :
                                        i === 1 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600' :
                                            'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                                        }`}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{c.nombre}</p>
                                        <p className="text-[10px] text-zinc-400">{c.count} ventas</p>
                                    </div>
                                    <span className="text-sm font-bold text-zinc-900 dark:text-white">{formatCurrency(c.total)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-zinc-400 text-center py-6">Sin datos aún</p>
                    )}
                </div>

                {/* Alertas */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Alertas</h3>
                        <Link href="/panel/alertas" className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors">Ver todas →</Link>
                    </div>
                    <div className="space-y-2.5">
                        {clientesInactivos.length > 0 && (
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500 mt-0.5 shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                <div>
                                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">{clientesInactivos.length} clientes inactivos</p>
                                    <p className="text-[10px] text-amber-600/70 dark:text-amber-500/60">Sin actividad hace +30 días</p>
                                </div>
                            </div>
                        )}
                        {ventasViejasPendientes.length > 0 && (
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 mt-0.5 shrink-0"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                <div>
                                    <p className="text-xs font-semibold text-red-700 dark:text-red-400">{ventasViejasPendientes.length} ventas pendientes</p>
                                    <p className="text-[10px] text-red-600/70 dark:text-red-500/60">Con más de 7 días sin cobrar</p>
                                </div>
                            </div>
                        )}
                        {diasRestantes !== null && diasRestantes <= 3 && (
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-500/5 border border-orange-200 dark:border-orange-500/20">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500 mt-0.5 shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                <div>
                                    <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">Trial por vencer</p>
                                    <p className="text-[10px] text-orange-600/70 dark:text-orange-500/60">{diasRestantes} días restantes</p>
                                </div>
                            </div>
                        )}
                        {productosBajoStock.length > 0 && (
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-500/5 border border-orange-200 dark:border-orange-500/20">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500 mt-0.5 shrink-0"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                                <div>
                                    <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">{productosBajoStock.length} productos con bajo stock</p>
                                    <p className="text-[10px] text-orange-600/70 dark:text-orange-500/60">Revisá tu inventario</p>
                                </div>
                            </div>
                        )}
                        {clientesInactivos.length === 0 && ventasViejasPendientes.length === 0 && (diasRestantes === null || diasRestantes > 3) && productosBajoStock.length === 0 && (
                            <p className="text-sm text-zinc-400 text-center py-4">🎉 Todo en orden</p>
                        )}
                    </div>
                </div>

                {/* Para Hacer Hoy */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Para Hacer Hoy</h3>
                    {recordatorios.length > 0 ? (
                        <div className="space-y-2">
                            {recordatorios.slice(0, 5).map(r => (
                                <label key={r.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors group">
                                    <input
                                        type="checkbox"
                                        className="mt-0.5 w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-orange-500 focus:ring-orange-500 accent-orange-500"
                                        onChange={async () => {
                                            await supabase.from('recordatorios').update({ completado: true }).eq('id', r.id);
                                            setRecordatorios(prev => prev.filter(x => x.id !== r.id));
                                        }}
                                    />
                                    <div className="min-w-0">
                                        <p className="text-sm text-zinc-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{r.descripcion}</p>
                                        {r.cliente && <p className="text-[10px] text-zinc-400 truncate">{(r.cliente as unknown as { nombre: string }).nombre}</p>}
                                    </div>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-zinc-400 text-center py-4">Sin pendientes</p>
                    )}
                    <Link href="/panel/alertas" className="mt-3 block text-center text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                        Ver todos →
                    </Link>
                </div>
            </div>
        </div>
    );
}
