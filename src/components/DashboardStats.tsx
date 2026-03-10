'use client';
import React from 'react';
import { Venta, Cliente } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
    ventas: Venta[];
    clientes: Cliente[];
}

export default function DashboardStats({ ventas, clientes }: Props) {
    const hoy = new Date();
    const mesesData = [];
    const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    for (let i = 5; i >= 0; i--) {
        const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        const mesIdx = fecha.getMonth();
        const anio = fecha.getFullYear();

        const ventasDelMes = ventas.filter(v => {
            const fv = new Date(v.fecha);
            return fv.getMonth() === mesIdx && fv.getFullYear() === anio;
        });

        const totalVendido = ventasDelMes.reduce((sum, v) => sum + (v.monto || 0), 0);
        const cantVentas = ventasDelMes.length;

        mesesData.push({
            mes: `${nombresMeses[mesIdx]} ${anio.toString().slice(-2)}`,
            vendido: totalVendido,
            cantidad: cantVentas
        });
    }

    const clienteStats = clientes.map(c => {
        const ventasCliente = ventas.filter(v => v.cliente_id === c.id);
        const total = ventasCliente.reduce((sum, v) => sum + (v.monto || 0), 0);
        return { nombre: c.nombre, total, compras: ventasCliente.length };
    }).sort((a, b) => b.total - a.total).slice(0, 5);

    const productCount: Record<string, number> = {};
    ventas.forEach(v => {
        if (v.detalle) {
            const prods = v.detalle.split(' + ');
            prods.forEach(p => {
                const clean = p.trim().toUpperCase();
                if (clean.length > 3 && !clean.includes('VENTA') && !clean.includes('EXTRACCIÓN')) {
                    productCount[clean] = (productCount[clean] || 0) + 1;
                }
            });
        }
    });
    const topProductos = Object.entries(productCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();
    const ventasMesActual = ventas.filter(v => {
        const fv = new Date(v.fecha);
        return fv.getMonth() === mesActual && fv.getFullYear() === anioActual;
    }).reduce((s, v) => s + (v.monto || 0), 0);

    const mesAnteriorIdx = mesActual === 0 ? 11 : mesActual - 1;
    const anioAnterior = mesActual === 0 ? anioActual - 1 : anioActual;
    const ventasMesAnterior = ventas.filter(v => {
        const fv = new Date(v.fecha);
        return fv.getMonth() === mesAnteriorIdx && fv.getFullYear() === anioAnterior;
    }).reduce((s, v) => s + (v.monto || 0), 0);

    const variacion = ventasMesAnterior > 0
        ? ((ventasMesActual - ventasMesAnterior) / ventasMesAnterior * 100).toFixed(1)
        : ventasMesActual > 0 ? '+100' : '0';
    const variacionPositiva = Number(variacion) >= 0;

    return (
        <div className="space-y-6">
            {/* Chart */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Facturación Mensual</h3>
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${variacionPositiva ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                        {variacionPositiva ? '↑' : '↓'} {variacion}% vs mes anterior
                    </div>
                </div>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mesesData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                            <XAxis dataKey="mes" stroke="#a1a1aa" fontWeight={500} fontSize={12} />
                            <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} stroke="#a1a1aa" fontWeight={500} fontSize={12} />
                            <Tooltip
                                formatter={(value: any) => [`$ ${Number(value).toLocaleString('es-AR')}`, 'Facturado']}
                                cursor={{ fill: '#f97316', opacity: 0.05 }}
                                contentStyle={{ backgroundColor: '#18181b', color: '#fff', border: '1px solid #27272a', borderRadius: '8px', fontSize: '13px' }}
                            />
                            <Bar dataKey="vendido" name="Facturado ($)" fill="#f97316" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Clients */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-4">Top 5 Clientes</h3>
                    <div className="space-y-3">
                        {clienteStats.length > 0 ? clienteStats.map((c, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${idx === 0 ? 'bg-orange-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                                    {idx + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-zinc-900 dark:text-white text-sm truncate">{c.nombre}</div>
                                    <div className="text-xs text-zinc-400">{c.compras} compras</div>
                                </div>
                                <span className="font-mono font-semibold text-orange-600 dark:text-orange-400 text-sm">
                                    ${c.total.toLocaleString('es-AR')}
                                </span>
                            </div>
                        )) : (
                            <p className="text-zinc-400 text-sm">Sin datos de clientes aún</p>
                        )}
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-4">Productos / Servicios Top</h3>
                    <div className="space-y-3">
                        {topProductos.length > 0 ? topProductos.map(([prod, count], idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${idx === 0 ? 'bg-amber-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                                    {idx + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-zinc-900 dark:text-white text-sm truncate">{prod}</div>
                                </div>
                                <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-medium px-2 py-0.5 rounded-full">
                                    {count}x
                                </span>
                            </div>
                        )) : (
                            <p className="text-zinc-400 text-sm">Sin datos de productos aún</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
