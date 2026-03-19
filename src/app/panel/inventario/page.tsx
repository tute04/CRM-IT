'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase-client';
import { useNegocio } from '@/contexts/NegocioContext';
import { useToast } from '@/contexts/ToastContext';
import { Producto } from '@/types';
import { formatCurrency } from '@/utils/helpers';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { MobileCard, MobileCardRow, MobileCardActions } from '@/components/ui/MobileCard';

const ITEMS_PER_PAGE = 20;

// ─── Íconos inline ─────────────────────────────────────────────
const IconBox = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
);
const IconEdit = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);
const IconTrash = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

export default function InventarioPage() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const [modalOpen, setModalOpen] = useState(false);
    const [editProducto, setEditProducto] = useState<Producto | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const [form, setForm] = useState({
        nombre: '',
        precio_unitario: 0,
        stock_actual: 0,
        stock_minimo: 0,
        unidad: 'unidad'
    });

    const supabase = createClient();
    const { negocio } = useNegocio();
    const { toast } = useToast();

    // ── TAREA 3: Soft Delete — fetchData filtra deleted_at IS NULL ──────────
    const fetchData = useCallback(async () => {
        if (!negocio) return;
        const { data, error } = await supabase
            .from('productos')
            .select('*')
            .is('deleted_at', null)
            .order('nombre');

        if (error) {
            console.error(error);
            toast('Error al cargar inventario', 'error');
        } else if (data) {
            setProductos(data as Producto[]);
        }
        setLoading(false);
    }, [supabase, negocio, toast]);

    useEffect(() => {
        if (negocio) {
            fetchData();
            const sub = supabase.channel('productos-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'productos', filter: `negocio_id=eq.${negocio.id}` }, fetchData)
                .subscribe();
            return () => { supabase.removeChannel(sub); };
        }
    }, [negocio, fetchData, supabase]);

    const filtered = productos.filter(p =>
        !search || p.nombre.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    useEffect(() => { setPage(1); }, [search]);

    const openCreateModal = () => {
        setEditProducto(null);
        setForm({ nombre: '', precio_unitario: 0, stock_actual: 0, stock_minimo: 0, unidad: 'unidad' });
        setModalOpen(true);
    };

    const openEditModal = (p: Producto) => {
        setEditProducto(p);
        setForm({
            nombre: p.nombre,
            precio_unitario: p.precio_unitario,
            stock_actual: p.stock_actual,
            stock_minimo: p.stock_minimo,
            unidad: p.unidad
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.nombre.trim()) { toast('El nombre es obligatorio', 'error'); return; }
        if (form.precio_unitario < 0) { toast('El precio no puede ser negativo', 'error'); return; }
        if (!negocio) return;

        const payload = {
            nombre: form.nombre.trim(),
            precio_unitario: form.precio_unitario,
            stock_actual: form.stock_actual,
            stock_minimo: form.stock_minimo,
            unidad: form.unidad,
            negocio_id: negocio.id
        };

        if (editProducto) {
            const { error } = await supabase.from('productos').update(payload).eq('id', editProducto.id);
            if (error) { toast('Error al actualizar: ' + error.message, 'error'); return; }
            toast('Producto actualizado');
        } else {
            const { error } = await supabase.from('productos').insert([payload]);
            if (error) { toast('Error al crear: ' + error.message, 'error'); return; }
            toast('Producto creado');
        }
        setModalOpen(false);
        fetchData();
    };

    const confirmDelete = (id: string) => setDeleteConfirmId(id);

    // ── TAREA 3: Soft Delete — UPDATE deleted_at en lugar de DELETE ──────────
    const handleDelete = async () => {
        if (!deleteConfirmId) return;
        const { error } = await supabase
            .from('productos')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', deleteConfirmId);
        if (error) { toast('Error al eliminar: ' + error.message, 'error'); setDeleteConfirmId(null); return; }
        toast('Producto archivado');
        setDeleteConfirmId(null);
        fetchData();
    };

    if (loading) return <SkeletonTable rows={8} />;

    // ── TAREA 1: Empty State diferenciado ────────────────────────────────────
    const isReallyEmpty = productos.length === 0 && !search;

    return (
        <div className="space-y-5 max-w-7xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Inventario</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{productos.length} productos registrados</p>
                </div>
                <button onClick={openCreateModal} className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors flex items-center gap-2 self-start sm:self-auto">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    Nuevo Producto
                </button>
            </div>

            {/* ── TAREA 1: Onboarding real (0 productos, sin búsqueda activa) ── */}
            {isReallyEmpty ? (
                <EmptyState
                    icon={<IconBox />}
                    title="Tu inventario está vacío"
                    description="Cargá tu primer producto para empezar a gestionar tu stock y recibir alertas de bajo inventario."
                    action={
                        <button onClick={openCreateModal} className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors flex items-center gap-2 mx-auto">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            + Agregar Producto
                        </button>
                    }
                />
            ) : (
                <>
                    {/* Filters */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 max-w-sm">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar producto..."
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400/50 outline-none text-zinc-900 dark:text-white transition-all"
                            />
                        </div>
                    </div>

                    {/* Sin resultados de búsqueda */}
                    {filtered.length === 0 ? (
                        <EmptyState
                            title="Sin resultados"
                            description={`No se encontraron productos que coincidan con "${search}".`}
                            action={
                                <button onClick={() => setSearch('')} className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                    Limpiar búsqueda
                                </button>
                            }
                        />
                    ) : (
                        <>
                            {/* ── TAREA 2: Vista Desktop — oculta en mobile ── */}
                            <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-zinc-100 dark:border-zinc-800">
                                                {['Producto', 'Precio Unit.', 'Stock', 'Unidad', 'Estado', 'Acciones'].map(h => (
                                                    <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginated.map(p => {
                                                const isLowStock = p.stock_actual <= p.stock_minimo;
                                                return (
                                                    <tr key={p.id} className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                                        <td className="px-5 py-3.5">
                                                            <p className="text-sm font-medium text-zinc-900 dark:text-white">{p.nombre}</p>
                                                        </td>
                                                        <td className="px-5 py-3.5 text-sm font-semibold text-zinc-900 dark:text-white">
                                                            {formatCurrency(p.precio_unitario)}
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <span className={`text-sm font-bold ${isLowStock ? 'text-red-500' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                                                {p.stock_actual}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3.5 text-sm text-zinc-500 dark:text-zinc-400">
                                                            {p.unidad}
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            {isLowStock ? (
                                                                <Badge variant="danger">Bajo stock</Badge>
                                                            ) : (
                                                                <Badge variant="success">OK</Badge>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-center gap-1">
                                                                <button onClick={() => openEditModal(p)} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors" title="Editar">
                                                                    <IconEdit />
                                                                </button>
                                                                <button onClick={() => confirmDelete(p.id)} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Eliminar">
                                                                    <IconTrash />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {totalPages > 1 && (
                                    <div className="px-5 pb-3 pt-1">
                                        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                                    </div>
                                )}
                            </div>

                            {/* ── TAREA 2: Vista Mobile (Cards) — oculta en md+ ── */}
                            <div className="md:hidden space-y-3">
                                {paginated.map(p => {
                                    const isLowStock = p.stock_actual <= p.stock_minimo;
                                    return (
                                        <MobileCard key={p.id}>
                                            {/* Cabecera */}
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-sm font-semibold text-zinc-900 dark:text-white">{p.nombre}</p>
                                                {isLowStock ? (
                                                    <Badge variant="danger">⚠ Bajo stock</Badge>
                                                ) : (
                                                    <Badge variant="success">OK</Badge>
                                                )}
                                            </div>

                                            <MobileCardRow label="Precio">
                                                <span className="font-semibold text-zinc-900 dark:text-white">{formatCurrency(p.precio_unitario)}</span>
                                            </MobileCardRow>
                                            <MobileCardRow label="Stock actual">
                                                <span className={`font-bold ${isLowStock ? 'text-red-500' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                                    {p.stock_actual} {p.unidad}
                                                </span>
                                            </MobileCardRow>
                                            <MobileCardRow label="Stock mínimo">
                                                <span>{p.stock_minimo} {p.unidad}</span>
                                            </MobileCardRow>

                                            <MobileCardActions>
                                                <button
                                                    onClick={() => openEditModal(p)}
                                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                                >
                                                    <IconEdit /> Editar
                                                </button>
                                                <button
                                                    onClick={() => confirmDelete(p.id)}
                                                    className="flex items-center justify-center p-2.5 rounded-lg border border-red-200 dark:border-red-500/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                >
                                                    <IconTrash />
                                                </button>
                                            </MobileCardActions>
                                        </MobileCard>
                                    );
                                })}
                                {totalPages > 1 && (
                                    <div className="pb-2">
                                        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Create / Edit Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editProducto ? 'Editar Producto' : 'Nuevo Producto'} size="sm">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Nombre *</label>
                        <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none focus:border-orange-400 transition-colors text-zinc-900 dark:text-white" placeholder="Ej: Shampoo bidón 5L" autoFocus />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Precio Unitario ($)</label>
                        <input type="number" value={form.precio_unitario || ''} onChange={e => setForm({ ...form, precio_unitario: Number(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none focus:border-orange-400 transition-colors text-zinc-900 dark:text-white" placeholder="0" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Stock Actual</label>
                            <input type="number" value={form.stock_actual || ''} onChange={e => setForm({ ...form, stock_actual: Number(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none focus:border-orange-400 transition-colors text-zinc-900 dark:text-white" placeholder="0" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Stock Mínimo (Alerta)</label>
                            <input type="number" value={form.stock_minimo || ''} onChange={e => setForm({ ...form, stock_minimo: Number(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none focus:border-orange-400 transition-colors text-zinc-900 dark:text-white" placeholder="0" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Unidad de medida</label>
                        <select value={form.unidad} onChange={e => setForm({ ...form, unidad: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none focus:border-orange-400 transition-colors text-zinc-900 dark:text-white">
                            <option value="unidad">Unidad</option>
                            <option value="kg">Kilogramos</option>
                            <option value="gr">Gramos</option>
                            <option value="l">Litros</option>
                            <option value="ml">Mililitros</option>
                            <option value="m">Metros</option>
                            <option value="cm">Centímetros</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 text-zinc-900 dark:text-white">
                        <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancelar</button>
                        <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors">
                            {editProducto ? 'Guardar Cambios' : 'Crear Producto'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="¿Archivar producto?">
                <div className="space-y-4">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">El producto será archivado y dejará de aparecer en el inventario. Sus datos quedan guardados y pueden recuperarse desde la base de datos.</p>
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancelar</button>
                        <button onClick={handleDelete} className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">Archivar</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
