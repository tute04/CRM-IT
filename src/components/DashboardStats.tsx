'use client';
import React from 'react';
import { Venta, Cliente } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
    ventas: Venta[];
    clientes: Cliente[];
}

export default function DashboardStats({ ventas, clientes }: Props) {
    // --- Calcular ventas mensuales reales (últimos 6 meses) ---
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

    // --- Top 5 clientes por facturación ---
    const clienteStats = clientes.map(c => {
        const ventasCliente = ventas.filter(v => v.cliente_id === c.id);
        const total = ventasCliente.reduce((sum, v) => sum + (v.monto || 0), 0);
        return { nombre: c.nombre, total, compras: ventasCliente.length };
    }).sort((a, b) => b.total - a.total).slice(0, 5);

    // --- Producto más vendido ---
    const productCount: Record<string, number> = {};
    ventas.forEach(v => {
        if (v.detalle) {
            // Separar por " + " en caso de múltiples productos
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

    // --- Comparativa mes actual vs anterior ---
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
            {/* Gráfico de Ventas Mensuales */}
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 transition-colors duration-300">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Facturación Mensual</h3>
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-black ${variacionPositiva ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                        {variacionPositiva ? '↑' : '↓'} {variacion}% vs mes anterior
                    </div>
                </div>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mesesData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                            <XAxis dataKey="mes" stroke="#a3a3a3" fontWeight="bold" fontSize={12} />
                            <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} stroke="#a3a3a3" fontWeight="bold" fontSize={12} />
                            <Tooltip
                                formatter={(value: any) => [`$ ${Number(value).toLocaleString('es-AR')}`, 'Facturado']}
                                cursor={{ fill: '#fef08a', opacity: 0.1 }}
                                contentStyle={{ backgroundColor: '#171717', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}
                            />
                            <Bar dataKey="vendido" name="Facturado ($)" fill="#facc15" stroke="#171717" strokeWidth={1} radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top 5 Clientes */}
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 transition-colors duration-300">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">🏆 Top 5 Clientes</h3>
                    <div className="space-y-3">
                        {clienteStats.length > 0 ? clienteStats.map((c, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-black ${idx === 0 ? 'bg-yellow-400 text-black' : idx === 1 ? 'bg-gray-300 dark:bg-neutral-600 text-black dark:text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400'}`}>
                                    {idx + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-gray-900 dark:text-white text-sm truncate">{c.nombre}</div>
                                    <div className="text-xs text-gray-500 dark:text-neutral-500">{c.compras} compras</div>
                                </div>
                                <span className="font-mono font-black text-yellow-600 dark:text-yellow-400 text-sm">
                                    ${c.total.toLocaleString('es-AR')}
                                </span>
                            </div>
                        )) : (
                            <p className="text-gray-500 dark:text-neutral-500 text-sm">Sin datos de clientes aún</p>
                        )}
                    </div>
                </div>

                {/* Productos Más Vendidos */}
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 transition-colors duration-300">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">📦 Productos Top</h3>
                    <div className="space-y-3">
                        {topProductos.length > 0 ? topProductos.map(([prod, count], idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <span className="text-lg">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-gray-900 dark:text-white text-sm truncate">{prod}</div>
                                </div>
                                <span className="bg-neutral-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 text-xs font-black px-2 py-1 rounded-full">
                                    {count}x vendido
                                </span>
                            </div>
                        )) : (
                            <p className="text-gray-500 dark:text-neutral-500 text-sm">Sin datos de productos aún</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
