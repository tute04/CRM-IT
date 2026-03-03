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

            // Encontrar la última venta
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
                    message: '🔥 Posible Cambio de Cubiertas',
                    wspText: `Hola ${cliente.nombre}, vi que hace unos 2 años compraste cubiertas. ¿Cómo vienen de dibujo? Avisame si te cotizo un juego nuevo...`
                });
            } else if (diffMs >= SIX_MONTHS_MS) {
                alerts.push({
                    cliente,
                    ultimaVenta,
                    type: 'WARNING',
                    priority: 2,
                    message: '⚠️ Alineación y Balanceo sugerido',
                    wspText: `Hola ${cliente.nombre}, hace unos 6 meses cambiaste las cubiertas. Para que te duren más, te sugiero hacerles alineación y balanceo...`
                });
            }
        });

        const sortedAlerts = alerts.sort((a, b) => a.priority - b.priority);

        return sortedAlerts.filter((item) => {
            if (!searchTerm) return true;
            const busqueda = searchTerm.toLowerCase();

            // Extraemos los campos asegurando que no sean undefined
            const nombreCliente = (item.cliente?.nombre || "").toLowerCase();
            const nombreVendedor = (item.ultimaVenta?.vendedor || "").toLowerCase();
            const fechaVenta = (item.ultimaVenta?.fecha || "").toLowerCase();

            // Retorna true si la búsqueda coincide con CLIENTE, VENDEDOR o FECHA
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
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 overflow-hidden hover:shadow-lg transition-all duration-300 ease-out hover:-translate-y-1">
            <div className="p-5 border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex justify-between items-center transition-colors duration-300">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Oportunidades Predictivas 🎯</h2>
                <span className="bg-yellow-400 text-black text-xs font-black px-3 py-1 rounded-full">{alertsToDisplay.length} alertas</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-neutral-950 text-gray-500 dark:text-neutral-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-neutral-800 transition-colors duration-300">
                        <tr>
                            <th className="p-4 font-semibold">Alerta Detectada</th>
                            <th className="p-4 font-semibold">Cliente</th>
                            <th className="p-4 font-semibold">Última Venta</th>
                            <th className="p-4 font-semibold text-right">Acción Comercial</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-800 transition-colors duration-300">
                        {alertsToDisplay.map((alerta, idx) => (
                            <tr key={idx} className="group bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors duration-300">
                                <td className="p-4">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border uppercase tracking-wide
                                        ${alerta.type === 'CRITICAL' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20'
                                            : 'bg-yellow-50 dark:bg-yellow-400/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-400/20'}`}
                                    >
                                        {alerta.message}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="font-bold text-gray-900 dark:text-white">{alerta.cliente.nombre}</div>
                                    <div className="text-sm font-mono text-gray-500 dark:text-neutral-400">{alerta.cliente.telefono}</div>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm text-gray-900 dark:text-white font-medium">{alerta.ultimaVenta.detalle}</div>
                                    <div className="text-xs text-gray-500 dark:text-neutral-500 mt-0.5">{new Date(alerta.ultimaVenta.fecha).toLocaleDateString('es-AR')}</div>
                                </td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => handleSendWhatsApp(alerta.cliente.telefono, alerta.wspText)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-950 dark:hover:bg-neutral-800 text-gray-900 dark:text-white border border-gray-300 dark:border-neutral-700 font-bold rounded-lg text-sm transition-all shadow-sm group-hover:border-yellow-400/50"
                                    >
                                        Enviar WhatsApp
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {alertsToDisplay.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-neutral-500 font-medium bg-white dark:bg-neutral-900 transition-colors duration-300">
                                    <span className="text-2xl block mb-2">✅</span>
                                    No hay alertas comerciales en este momento.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
