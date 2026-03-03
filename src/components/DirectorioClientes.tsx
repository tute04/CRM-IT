'use client';
import React, { useState } from 'react';
import { Cliente, Venta } from '@/types';
import { supabase } from '@/utils/supabase';

interface Props {
    clientes: Cliente[];
    ventas: Venta[];
    searchTerm: string;
}

export default function DirectorioClientes({ clientes, ventas, searchTerm }: Props) {
    const handleDeleteCliente = async (clienteId: string) => {
        if (window.confirm("¿Estás seguro de eliminar este cliente y todo su historial?")) {
            const { error } = await supabase.from('clientes').delete().eq('id', clienteId);
            if (error) {
                console.error("Error al eliminar cliente:", error);
                alert("Error al eliminar cliente: " + error.message);
            }
        }
    };

    const directorioRaw = clientes.map(c => {
        const ventasCliente = ventas.filter(v => v.cliente_id === c.id);
        const totalComprado = ventasCliente.reduce((sum, v) => sum + Number(v.monto || 0), 0);
        const ultimaCompra = ventasCliente.length > 0 ? new Date(ventasCliente[0].fecha).toLocaleDateString('es-AR') : 'Sin Compras';

        // Let's add latest seller here to the object so it can be searchable too over the combo
        const vendedor = ventasCliente.length > 0 ? ventasCliente[0].vendedor : '';
        return { ...c, ventasTotales: ventasCliente.length, totalComprado, ultimaCompra, vendedor };
    });

    const clientesFiltrados = directorioRaw.filter(cliente => {
        if (!searchTerm) return true;
        const busqueda = searchTerm.toLowerCase();
        return (
            (cliente.nombre?.toLowerCase().includes(busqueda)) ||
            (cliente.telefono?.toLowerCase().includes(busqueda)) ||
            (cliente.vendedor?.toLowerCase().includes(busqueda))
        );
    });

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm dark:shadow-lg border border-gray-200 dark:border-neutral-800 overflow-hidden transition-colors duration-300">
            <div className="p-5 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950 flex items-center transition-colors duration-300">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Directorio Maestro de Clientes</h2>
            </div>
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto w-full scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 dark:bg-neutral-950 text-gray-600 dark:text-neutral-400 sticky top-0 border-b border-gray-200 dark:border-neutral-800 transition-colors duration-300 z-10">
                        <tr>
                            <th className="p-4 font-bold text-sm uppercase tracking-wider">Cliente</th>
                            <th className="p-4 font-bold text-sm uppercase tracking-wider">Contacto</th>
                            <th className="p-4 font-bold text-sm uppercase tracking-wider text-center">Cant. Compras</th>
                            <th className="p-4 font-bold text-sm uppercase tracking-wider">Última Compra</th>
                            <th className="p-4 font-bold text-sm uppercase tracking-wider text-right">Total Facturado</th>
                            <th className="p-4 font-bold text-sm uppercase tracking-wider text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-800 transition-colors duration-300">
                        {clientesFiltrados.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-neutral-800/80 transition-colors duration-300">
                                <td className="p-4 font-bold text-gray-900 dark:text-white">{item.nombre}</td>
                                <td className="p-4 text-gray-600 dark:text-neutral-400">{item.telefono}</td>
                                <td className="p-4 text-center text-gray-700 dark:text-neutral-300 font-bold">{item.ventasTotales}</td>
                                <td className="p-4 text-gray-600 dark:text-neutral-400">{item.ultimaCompra}</td>
                                <td className="p-4 text-right font-mono font-bold text-gray-900 dark:text-yellow-400">${Number(item.totalComprado || 0).toLocaleString('es-AR')}</td>
                                <td className="p-4 text-center">
                                    <button
                                        onClick={() => handleDeleteCliente(item.id)}
                                        className="text-red-500 hover:text-red-400 font-bold text-sm transition-colors"
                                        title="Eliminar Cliente y su historial"
                                    >
                                        Borrar
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {clientesFiltrados.length === 0 && (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500 dark:text-neutral-500 font-medium">No se encontraron resultados en la base de datos.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
