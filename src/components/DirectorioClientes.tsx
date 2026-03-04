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
    const [expandedClienteId, setExpandedClienteId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editNombre, setEditNombre] = useState('');
    const [editTelefono, setEditTelefono] = useState('');

    const handleDeleteCliente = async (clienteId: string) => {
        if (window.confirm("¿Estás seguro de eliminar este cliente y todo su historial?")) {
            const { error } = await supabase.from('clientes').delete().eq('id', clienteId);
            if (error) {
                console.error("Error al eliminar cliente:", error);
                alert("Error al eliminar cliente: " + error.message);
            }
        }
    };

    const handleStartEdit = (c: Cliente) => {
        setEditingId(c.id);
        setEditNombre(c.nombre);
        setEditTelefono(c.telefono || '');
    };

    const handleSaveEdit = async () => {
        if (!editingId || editNombre.trim().length < 2) return;
        const { error } = await supabase.from('clientes').update({
            nombre: editNombre.trim(),
            telefono: editTelefono.trim()
        }).eq('id', editingId);
        if (error) {
            alert("Error al guardar: " + error.message);
        }
        setEditingId(null);
    };

    const directorioRaw = clientes.map(c => {
        const ventasCliente = ventas
            .filter(v => v.cliente_id === c.id)
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        const totalComprado = ventasCliente.reduce((sum, v) => sum + Number(v.monto || 0), 0);
        const ultimaCompra = ventasCliente.length > 0 ? new Date(ventasCliente[0].fecha).toLocaleDateString('es-AR') : 'Sin Compras';
        const vendedor = ventasCliente.length > 0 ? ventasCliente[0].vendedor : '';

        // Calcular días desde última compra para alertas
        const diasDesdeUltimaCompra = ventasCliente.length > 0
            ? Math.floor((Date.now() - new Date(ventasCliente[0].fecha).getTime()) / (1000 * 60 * 60 * 24))
            : -1;

        return { ...c, ventasCliente, ventasTotales: ventasCliente.length, totalComprado, ultimaCompra, vendedor, diasDesdeUltimaCompra };
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

    const getAlertBadge = (dias: number) => {
        if (dias === -1) return null;
        if (dias >= 730) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">🔥 +2 años</span>;
        if (dias >= 365) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20">⚠️ +1 año</span>;
        if (dias >= 180) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-yellow-100 dark:bg-yellow-400/10 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-400/20">⏰ +6 meses</span>;
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20">✅ Al día</span>;
    };

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm dark:shadow-lg border border-gray-200 dark:border-neutral-800 overflow-hidden transition-colors duration-300">
            <div className="p-5 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950 flex items-center justify-between transition-colors duration-300">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Directorio Maestro de Clientes</h2>
                <span className="bg-neutral-200 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 text-xs font-black px-3 py-1 rounded-full">{clientesFiltrados.length} clientes</span>
            </div>
            <div className="overflow-x-auto max-h-[65vh] overflow-y-auto w-full scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 dark:bg-neutral-950 text-gray-600 dark:text-neutral-400 sticky top-0 border-b border-gray-200 dark:border-neutral-800 transition-colors duration-300 z-10">
                        <tr>
                            <th className="p-4 font-bold text-sm uppercase tracking-wider">Cliente</th>
                            <th className="p-4 font-bold text-sm uppercase tracking-wider">Contacto</th>
                            <th className="p-4 font-bold text-sm uppercase tracking-wider text-center">Estado</th>
                            <th className="p-4 font-bold text-sm uppercase tracking-wider text-center">Compras</th>
                            <th className="p-4 font-bold text-sm uppercase tracking-wider">Última Compra</th>
                            <th className="p-4 font-bold text-sm uppercase tracking-wider text-right">Total Facturado</th>
                            <th className="p-4 font-bold text-sm uppercase tracking-wider text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-800 transition-colors duration-300">
                        {clientesFiltrados.map((item) => (
                            <React.Fragment key={item.id}>
                                {/* Fila principal del cliente */}
                                <tr
                                    className={`cursor-pointer transition-colors duration-200 ${expandedClienteId === item.id ? 'bg-yellow-50/50 dark:bg-yellow-400/5' : 'hover:bg-gray-50 dark:hover:bg-neutral-800/80'}`}
                                    onClick={() => setExpandedClienteId(expandedClienteId === item.id ? null : item.id)}
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs transition-transform duration-200 ${expandedClienteId === item.id ? 'rotate-90' : ''}`}>▶</span>
                                            {editingId === item.id ? (
                                                <input
                                                    value={editNombre}
                                                    onChange={e => setEditNombre(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                                                    onClick={e => e.stopPropagation()}
                                                    className="bg-neutral-950 border border-yellow-400/50 text-white rounded-lg px-2 py-1 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-yellow-400 w-40"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="font-bold text-gray-900 dark:text-white">{item.nombre}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4" onClick={e => e.stopPropagation()}>
                                        {editingId === item.id ? (
                                            <input
                                                value={editTelefono}
                                                onChange={e => setEditTelefono(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                                                placeholder="Ej: 3513001234"
                                                className="bg-neutral-950 border border-neutral-700 text-white rounded-lg px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-yellow-400 w-32"
                                            />
                                        ) : (
                                            <span className="text-gray-600 dark:text-neutral-400 font-mono text-sm">{item.telefono || <span className="text-neutral-600 italic text-xs">Sin teléfono</span>}</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">{getAlertBadge(item.diasDesdeUltimaCompra)}</td>
                                    <td className="p-4 text-center text-gray-700 dark:text-neutral-300 font-bold">{item.ventasTotales}</td>
                                    <td className="p-4 text-gray-600 dark:text-neutral-400 text-sm">{item.ultimaCompra}</td>
                                    <td className="p-4 text-right font-mono font-bold text-gray-900 dark:text-yellow-400">${Number(item.totalComprado || 0).toLocaleString('es-AR')}</td>
                                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                        {editingId === item.id ? (
                                            <div className="flex gap-2 justify-center">
                                                <button onClick={handleSaveEdit} className="text-green-500 hover:text-green-400 font-bold text-sm transition-colors">Guardar</button>
                                                <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-400 font-bold text-sm transition-colors">Cancelar</button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-3 justify-center">
                                                <button
                                                    onClick={() => handleStartEdit(item)}
                                                    className="text-yellow-500 hover:text-yellow-400 font-bold text-sm transition-colors"
                                                    title="Editar Cliente"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCliente(item.id)}
                                                    className="text-red-500/60 hover:text-red-400 font-bold text-sm transition-colors"
                                                    title="Eliminar Cliente y su historial"
                                                >
                                                    Borrar
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>

                                {/* Fila expandible: Historial de compras */}
                                {expandedClienteId === item.id && (
                                    <tr>
                                        <td colSpan={7} className="p-0">
                                            <div className="bg-gray-50 dark:bg-neutral-950/50 border-t border-b border-yellow-200 dark:border-yellow-500/20 px-8 py-4 animate-in slide-in-from-top-2">
                                                <h4 className="text-sm font-black text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                                                    Historial de Compras — {item.nombre}
                                                </h4>
                                                {item.ventasCliente.length > 0 ? (
                                                    <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-700 pr-2">
                                                        {item.ventasCliente.map((v, idx) => (
                                                            <div key={v.id || idx} className="flex items-center gap-4 bg-white dark:bg-neutral-900 rounded-lg px-4 py-3 border border-gray-200 dark:border-neutral-800 shadow-sm hover:border-yellow-300 dark:hover:border-yellow-500/30 transition-colors">
                                                                <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-bold text-gray-900 dark:text-white text-sm truncate">{v.detalle || 'Sin detalle'}</div>
                                                                    <div className="text-xs text-gray-500 dark:text-neutral-500 mt-0.5">
                                                                        {new Date(v.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                                        {v.vendedor && <> · Vendedor: <span className="font-bold">{v.vendedor}</span></>}
                                                                    </div>
                                                                </div>
                                                                <span className="font-mono font-black text-yellow-600 dark:text-yellow-400 text-sm flex-shrink-0">
                                                                    ${Number(v.monto || 0).toLocaleString('es-AR')}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500 dark:text-neutral-500 text-sm py-2">Este cliente aún no tiene compras registradas.</p>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                        {clientesFiltrados.length === 0 && (
                            <tr><td colSpan={7} className="p-8 text-center text-gray-500 dark:text-neutral-500 font-medium">No se encontraron resultados en la base de datos.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
