'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase-client';
import { useNegocio } from '@/contexts/NegocioContext';
import { useToast } from '@/contexts/ToastContext';
import { Cliente, Producto } from '@/types';
import { formatDate, formatCurrency } from '@/utils/helpers';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';

type Tab = 'clientes' | 'productos';

const IconTrash2 = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
    </svg>
);
const IconRestore = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
    </svg>
);
const IconDelete = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

export default function PapeleraPage() {
    const [tab, setTab] = useState<Tab>('clientes');
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmItem, setConfirmItem] = useState<{ id: string; tipo: Tab; action: 'restore' | 'delete' } | null>(null);

    const supabase = createClient();
    const { negocio } = useNegocio();
    const { toast } = useToast();

    const fetchArchivados = useCallback(async () => {
        if (!negocio) return;
        setLoading(true);
        const [cRes, pRes] = await Promise.all([
            supabase.from('clientes').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
            supabase.from('productos').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
        ]);
        if (cRes.data) setClientes(cRes.data as Cliente[]);
        if (pRes.data) setProductos(pRes.data as Producto[]);
        setLoading(false);
    }, [supabase, negocio]);

    useEffect(() => { fetchArchivados(); }, [fetchArchivados]);

    const handleConfirm = async () => {
        if (!confirmItem) return;
        const { id, tipo, action } = confirmItem;
        const table = tipo === 'clientes' ? 'clientes' : 'productos';

        if (action === 'restore') {
            const { error } = await supabase.from(table).update({ deleted_at: null }).eq('id', id);
            if (error) { toast('Error al restaurar: ' + error.message, 'error'); }
            else { toast(`${tipo === 'clientes' ? 'Cliente' : 'Producto'} restaurado ✓`); }
        } else {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) { toast('Error al eliminar: ' + error.message, 'error'); }
            else { toast(`Eliminado permanentemente`); }
        }
        setConfirmItem(null);
        fetchArchivados();
    };

    const currentList = tab === 'clientes' ? clientes : productos;

    return (
        <div className="space-y-5 max-w-4xl mx-auto animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center text-red-500">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    </span>
                    Papelera
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Los registros archivados se guardan aquí. Podés restaurarlos o eliminarlos definitivamente.
                </p>
            </div>

            {/* Warning banner */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500 shrink-0 mt-0.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                    <strong>Eliminar definitivamente</strong> borra el registro de la base de datos y no puede revertirse. <strong>Restaurar</strong> lo devuelve a la lista activa.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl w-fit">
                {(['clientes', 'productos'] as Tab[]).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${tab === t
                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                            }`}
                    >
                        {t === 'clientes' ? 'Clientes' : 'Productos'}
                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab === t ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'}`}>
                            {t === 'clientes' ? clientes.length : productos.length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : currentList.length === 0 ? (
                <EmptyState
                    icon={<IconTrash2 />}
                    title={`Sin ${tab} archivados`}
                    description={`No hay ${tab} en la papelera. Al archivar un ${tab === 'clientes' ? 'cliente' : 'producto'} desde su módulo, aparecerá aquí.`}
                />
            ) : (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                        {tab === 'clientes' ? 'Cliente' : 'Producto'}
                                    </th>
                                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                        {tab === 'clientes' ? 'Teléfono / Email' : 'Precio / Stock'}
                                    </th>
                                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Archivado</th>
                                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tab === 'clientes'
                                    ? (clientes as Cliente[]).map(c => (
                                        <tr key={c.id} className="border-b border-zinc-50 dark:border-zinc-800/50">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center text-red-500 text-xs font-bold shrink-0">
                                                        {c.nombre.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{c.nombre}</p>
                                                        {c.rubro && <p className="text-xs text-zinc-400">{c.rubro}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="text-sm text-zinc-600 dark:text-zinc-400">{c.telefono || '—'}</p>
                                                <p className="text-xs text-zinc-400">{c.email || ''}</p>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-zinc-500 dark:text-zinc-400">
                                                {c.deleted_at ? formatDate(c.deleted_at) : '—'}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <ActionButtons onRestore={() => setConfirmItem({ id: c.id, tipo: 'clientes', action: 'restore' })} onDelete={() => setConfirmItem({ id: c.id, tipo: 'clientes', action: 'delete' })} />
                                            </td>
                                        </tr>
                                    ))
                                    : (productos as Producto[]).map(p => (
                                        <tr key={p.id} className="border-b border-zinc-50 dark:border-zinc-800/50">
                                            <td className="px-5 py-3.5">
                                                <p className="text-sm font-medium text-zinc-900 dark:text-white">{p.nombre}</p>
                                                <p className="text-xs text-zinc-400">{p.unidad}</p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="text-sm font-semibold text-zinc-900 dark:text-white">{formatCurrency(p.precio_unitario)}</p>
                                                <p className="text-xs text-zinc-400">Stock: {p.stock_actual}</p>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-zinc-500 dark:text-zinc-400">
                                                {p.deleted_at ? formatDate(p.deleted_at) : '—'}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <ActionButtons onRestore={() => setConfirmItem({ id: p.id, tipo: 'productos', action: 'restore' })} onDelete={() => setConfirmItem({ id: p.id, tipo: 'productos', action: 'delete' })} />
                                            </td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                        {tab === 'clientes'
                            ? (clientes as Cliente[]).map(c => (
                                <div key={c.id} className="p-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center text-red-500 text-sm font-bold shrink-0">
                                            {c.nombre.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{c.nombre}</p>
                                            <p className="text-xs text-zinc-400">Archivado: {c.deleted_at ? formatDate(c.deleted_at) : '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setConfirmItem({ id: c.id, tipo: 'clientes', action: 'restore' })} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors">
                                            <IconRestore /> Restaurar
                                        </button>
                                        <button onClick={() => setConfirmItem({ id: c.id, tipo: 'clientes', action: 'delete' })} className="flex items-center justify-center p-2.5 rounded-lg border border-red-200 dark:border-red-500/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                            <IconDelete />
                                        </button>
                                    </div>
                                </div>
                            ))
                            : (productos as Producto[]).map(p => (
                                <div key={p.id} className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-zinc-900 dark:text-white">{p.nombre}</p>
                                            <p className="text-xs text-zinc-400">{formatCurrency(p.precio_unitario)} · Stock: {p.stock_actual} {p.unidad}</p>
                                            <p className="text-xs text-zinc-400 mt-0.5">Archivado: {p.deleted_at ? formatDate(p.deleted_at) : '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setConfirmItem({ id: p.id, tipo: 'productos', action: 'restore' })} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors">
                                            <IconRestore /> Restaurar
                                        </button>
                                        <button onClick={() => setConfirmItem({ id: p.id, tipo: 'productos', action: 'delete' })} className="flex items-center justify-center p-2.5 rounded-lg border border-red-200 dark:border-red-500/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                            <IconDelete />
                                        </button>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            )}

            {/* Confirm Modal */}
            <Modal
                isOpen={!!confirmItem}
                onClose={() => setConfirmItem(null)}
                title={confirmItem?.action === 'restore' ? '¿Restaurar registro?' : '¿Eliminar definitivamente?'}
            >
                <div className="space-y-4">
                    {confirmItem?.action === 'restore' ? (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            El registro volverá a aparecer en la lista activa. Podrás seguir usándolo normalmente.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                Esta acción es <strong className="text-red-500">irreversible</strong>. El registro será eliminado permanentemente de la base de datos.
                            </p>
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                                <p className="text-xs text-red-600 dark:text-red-400 font-semibold">⚠ Esta acción no puede deshacerse</p>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => setConfirmItem(null)} className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            className={`px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors ${confirmItem?.action === 'restore'
                                ? 'bg-emerald-500 hover:bg-emerald-600'
                                : 'bg-red-500 hover:bg-red-600'
                                }`}
                        >
                            {confirmItem?.action === 'restore' ? 'Sí, restaurar' : 'Sí, eliminar'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function ActionButtons({ onRestore, onDelete }: { onRestore: () => void; onDelete: () => void }) {
    return (
        <div className="flex items-center gap-1.5">
            <button
                onClick={onRestore}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
                title="Restaurar"
            >
                <IconRestore /> Restaurar
            </button>
            <button
                onClick={onDelete}
                className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                title="Eliminar permanentemente"
            >
                <IconDelete />
            </button>
        </div>
    );
}
