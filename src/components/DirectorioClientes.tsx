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
        if (error) alert("Error al guardar: " + error.message);
        setEditingId(null);
    };

    const directorioRaw = clientes.map(c => {
        const ventasCliente = ventas
            .filter(v => v.cliente_id === c.id)
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        const totalComprado = ventasCliente.reduce((sum, v) => sum + Number(v.monto || 0), 0);
        const ultimaCompra = ventasCliente.length > 0 ? new Date(ventasCliente[0].fecha).toLocaleDateString('es-AR') : 'Sin ventas';
        const vendedor = ventasCliente.length > 0 ? ventasCliente[0].vendedor : '';
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
        if (dias >= 730) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20"><span className="w-1 h-1 bg-red-500 rounded-full" />+2 años</span>;
        if (dias >= 365) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20"><span className="w-1 h-1 bg-amber-500 rounded-full" />+1 año</span>;
        if (dias >= 180) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20"><span className="w-1 h-1 bg-orange-500 rounded-full" />+6 meses</span>;
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"><span className="w-1 h-1 bg-emerald-500 rounded-full" />Al día</span>;
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Directorio de Clientes</h2>
                <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-medium px-2.5 py-1 rounded-full">{clientesFiltrados.length} clientes</span>
            </div>
            <div className="overflow-x-auto max-h-[65vh] overflow-y-auto w-full">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 sticky top-0 border-b border-zinc-200 dark:border-zinc-800 z-10">
                        <tr>
                            <th className="p-4 font-medium text-xs uppercase tracking-wider">Cliente</th>
                            <th className="p-4 font-medium text-xs uppercase tracking-wider">Contacto</th>
                            <th className="p-4 font-medium text-xs uppercase tracking-wider text-center">Estado</th>
                            <th className="p-4 font-medium text-xs uppercase tracking-wider text-center">Ventas</th>
                            <th className="p-4 font-medium text-xs uppercase tracking-wider">Última Venta</th>
                            <th className="p-4 font-medium text-xs uppercase tracking-wider text-right">Total</th>
                            <th className="p-4 font-medium text-xs uppercase tracking-wider text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {clientesFiltrados.map((item) => (
                            <React.Fragment key={item.id}>
                                <tr
                                    className={`cursor-pointer transition-colors ${expandedClienteId === item.id ? 'bg-orange-50/50 dark:bg-orange-500/5' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                                    onClick={() => setExpandedClienteId(expandedClienteId === item.id ? null : item.id)}
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <svg className={`w-3 h-3 text-zinc-400 transition-transform ${expandedClienteId === item.id ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                                            {editingId === item.id ? (
                                                <input
                                                    value={editNombre}
                                                    onChange={e => setEditNombre(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                                                    onClick={e => e.stopPropagation()}
                                                    className="bg-zinc-50 dark:bg-zinc-800 border border-orange-300 dark:border-orange-500/50 text-zinc-900 dark:text-white rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 w-40"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="font-medium text-zinc-900 dark:text-white text-sm">{item.nombre}</span>
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
                                                className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-lg px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-orange-500 w-32"
                                            />
                                        ) : (
                                            <span className="text-zinc-500 font-mono text-sm">{item.telefono || <span className="text-zinc-400 italic text-xs">Sin teléfono</span>}</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">{getAlertBadge(item.diasDesdeUltimaCompra)}</td>
                                    <td className="p-4 text-center text-zinc-600 dark:text-zinc-300 font-medium text-sm">{item.ventasTotales}</td>
                                    <td className="p-4 text-zinc-500 text-sm">{item.ultimaCompra}</td>
                                    <td className="p-4 text-right font-mono font-semibold text-orange-600 dark:text-orange-400 text-sm">${Number(item.totalComprado || 0).toLocaleString('es-AR')}</td>
                                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                        {editingId === item.id ? (
                                            <div className="flex gap-2 justify-center">
                                                <button onClick={handleSaveEdit} className="text-emerald-500 hover:text-emerald-400 font-medium text-xs">Guardar</button>
                                                <button onClick={() => setEditingId(null)} className="text-zinc-400 hover:text-zinc-300 font-medium text-xs">Cancelar</button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2 justify-center">
                                                <button onClick={() => handleStartEdit(item)} className="text-orange-500 hover:text-orange-400 font-medium text-xs">Editar</button>
                                                <button onClick={() => handleDeleteCliente(item.id)} className="text-zinc-400 hover:text-red-400 font-medium text-xs">Borrar</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>

                                {expandedClienteId === item.id && (
                                    <tr>
                                        <td colSpan={7} className="p-0">
                                            <div className="bg-zinc-50 dark:bg-zinc-950/50 border-t border-b border-orange-200 dark:border-orange-500/20 px-8 py-4 animate-fade-in">
                                                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                                                    Historial — {item.nombre}
                                                </h4>
                                                {item.ventasCliente.length > 0 ? (
                                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                                        {item.ventasCliente.map((v, idx) => (
                                                            <div key={v.id || idx} className="flex items-center gap-4 bg-white dark:bg-zinc-900 rounded-lg px-4 py-3 border border-zinc-200 dark:border-zinc-800 hover:border-orange-200 dark:hover:border-orange-500/30 transition-colors">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-medium text-zinc-900 dark:text-white text-sm truncate">{v.detalle || 'Sin detalle'}</div>
                                                                    <div className="text-xs text-zinc-400 mt-0.5">
                                                                        {new Date(v.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                                        {v.vendedor && <> · Vendedor: <span className="font-medium">{v.vendedor}</span></>}
                                                                    </div>
                                                                </div>
                                                                <span className="font-mono font-semibold text-orange-600 dark:text-orange-400 text-sm flex-shrink-0">
                                                                    ${Number(v.monto || 0).toLocaleString('es-AR')}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-zinc-400 text-sm py-2">Este cliente aún no tiene ventas registradas.</p>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                        {clientesFiltrados.length === 0 && (
                            <tr><td colSpan={7} className="p-8 text-center text-zinc-400 text-sm">No se encontraron resultados.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
