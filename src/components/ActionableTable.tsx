'use client';
import React from 'react';
import { Venta, Cliente } from '../types';

interface Props {
    ventas: Venta[];
    clientes: Cliente[];
    searchTerm: string;
}

export default function ActionableTable({ ventas, clientes, searchTerm }: Props) {
    const now = new Date();
    const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;
    const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;

    const generateAlerts = () => {
        const alerts: any[] = [];

        clientes.forEach(cliente => {
            const ventasCliente = ventas.filter(v => v.cliente_id === cliente.id);
            if (ventasCliente.length === 0) return;

            const ultimaVenta = ventasCliente.reduce((latest, current) => {
                return new Date(current.fecha) > new Date(latest.fecha) ? current : latest;
            });

            const diffMs = now.getTime() - new Date(ultimaVenta.fecha).getTime();

            if (diffMs >= TWO_YEARS_MS) {
                alerts.push({
                    cliente,
                    ultimaVenta,
                    type: 'CRITICAL',
                    priority: 1,
                    message: 'Cliente inactivo +2 años',
                    wspText: `Hola ${cliente.nombre}, hace tiempo que no nos visitás. ¿Necesitás algo? ¡Estamos para ayudarte!`
                });
            } else if (diffMs >= SIX_MONTHS_MS) {
                alerts.push({
                    cliente,
                    ultimaVenta,
                    type: 'WARNING',
                    priority: 2,
                    message: 'Sin actividad +6 meses',
                    wspText: `Hola ${cliente.nombre}, hace unos meses que no te vemos. ¿Te podemos ayudar en algo?`
                });
            }
        });

        const sortedAlerts = alerts.sort((a, b) => a.priority - b.priority);

        return sortedAlerts.filter((item) => {
            if (!searchTerm) return true;
            const busqueda = searchTerm.toLowerCase();
            const nombreCliente = (item.cliente?.nombre || "").toLowerCase();
            const nombreVendedor = (item.ultimaVenta?.vendedor || "").toLowerCase();
            const fechaVenta = (item.ultimaVenta?.fecha || "").toLowerCase();
            return (
                nombreCliente.includes(busqueda) ||
                nombreVendedor.includes(busqueda) ||
                fechaVenta.includes(busqueda)
            );
        });
    };

    const alertsToDisplay = generateAlerts();

    const handleSendWhatsApp = (phone: string, text: string) => {
        const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Oportunidades de seguimiento</h2>
                <span className="bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-orange-200 dark:border-orange-500/20">{alertsToDisplay.length} alertas</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                            <th className="p-4 font-medium">Estado</th>
                            <th className="p-4 font-medium">Cliente</th>
                            <th className="p-4 font-medium">Última Venta</th>
                            <th className="p-4 font-medium text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {alertsToDisplay.map((alerta, idx) => (
                            <tr key={idx} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <td className="p-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border
                                        ${alerta.type === 'CRITICAL' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20'
                                            : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'}`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${alerta.type === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                        {alerta.message}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="font-medium text-zinc-900 dark:text-white text-sm">{alerta.cliente.nombre}</div>
                                    <div className="text-xs text-zinc-500 font-mono">{alerta.cliente.telefono}</div>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm text-zinc-700 dark:text-zinc-300">{alerta.ultimaVenta.detalle}</div>
                                    <div className="text-xs text-zinc-400 mt-0.5">{new Date(alerta.ultimaVenta.fecha).toLocaleDateString('es-AR')}</div>
                                </td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => handleSendWhatsApp(alerta.cliente.telefono, alerta.wspText)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-300 dark:hover:border-emerald-500/30 text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium rounded-lg text-xs transition-all"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                                        WhatsApp
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {alertsToDisplay.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-12 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        </div>
                                        <p className="text-zinc-900 dark:text-white font-medium text-sm">¡Todo al día!</p>
                                        <p className="text-zinc-500 text-xs max-w-xs">No hay clientes pendientes de seguimiento. Las alertas aparecerán automáticamente.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
