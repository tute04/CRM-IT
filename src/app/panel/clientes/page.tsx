'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase-client';
import { useNegocio } from '@/contexts/NegocioContext';
import { useToast } from '@/contexts/ToastContext';
import { Cliente, Venta } from '@/types';
import { formatCurrency, formatDate, daysSince, whatsappUrl } from '@/utils/helpers';
import { exportToCSV } from '@/utils/csv-export';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { MobileCard, MobileCardRow, MobileCardActions } from '@/components/ui/MobileCard';
import ClientDrawer from '@/components/ui/ClientDrawer';

const ITEMS_PER_PAGE = 20;

// ─── Íconos inline ────────────────────────────────────────────
const IconUsers = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
const IconWA = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

export default function ClientesPage() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterTag, setFilterTag] = useState('');
    const [filterInactivo, setFilterInactivo] = useState(false);
    const [page, setPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [fichaOpen, setFichaOpen] = useState<Cliente | null>(null);
    const [editCliente, setEditCliente] = useState<Cliente | null>(null);
    const [form, setForm] = useState({ nombre: '', telefono: '', email: '', direccion: '', rubro: '', notas: '', etiquetas: '' });
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const supabase = createClient();
    const { negocio } = useNegocio();
    const { toast } = useToast();

    // ── TAREA 3: Soft Delete — fetchData filtra deleted_at IS NULL ──────────
    const fetchData = useCallback(async () => {
        const [cRes, vRes] = await Promise.all([
            supabase.from('clientes').select('*').is('deleted_at', null).order('nombre'),
            supabase.from('ventas').select('*').order('fecha', { ascending: false }),
        ]);
        if (cRes.data) setClientes(cRes.data as Cliente[]);
        if (vRes.data) setVentas(vRes.data as Venta[]);
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        if (negocio) {
            fetchData();
            const sub = supabase.channel('clientes-page')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, fetchData)
                .subscribe();
            return () => { supabase.removeChannel(sub); };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [negocio]);

    const allTags = [...new Set(clientes.flatMap(c => c.etiquetas || []))].sort();

    const filtered = clientes.filter(c => {
        const matchesSearch = !search || c.nombre.toLowerCase().includes(search.toLowerCase()) || c.telefono?.includes(search) || c.email?.toLowerCase().includes(search.toLowerCase());
        const matchesTag = !filterTag || (c.etiquetas || []).includes(filterTag);
        const matchesInactivo = !filterInactivo || daysSince(c.ultimo_contacto || c.created_at || '') > 60;
        return matchesSearch && matchesTag && matchesInactivo;
    });

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    useEffect(() => { setPage(1); }, [search, filterTag, filterInactivo]);

    const openCreateModal = () => {
        setEditCliente(null);
        setForm({ nombre: '', telefono: '', email: '', direccion: '', rubro: '', notas: '', etiquetas: '' });
        setModalOpen(true);
    };

    const openEditModal = (c: Cliente) => {
        setEditCliente(c);
        setForm({
            nombre: c.nombre || '',
            telefono: c.telefono || '',
            email: c.email || '',
            direccion: c.direccion || '',
            rubro: c.rubro || '',
            notas: c.notas || '',
            etiquetas: (c.etiquetas || []).join(', '),
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.nombre.trim()) { toast('El nombre es obligatorio', 'error'); return; }
        if (!negocio) return;

        const etiquetas = form.etiquetas.split(',').map(t => t.trim()).filter(Boolean);
        const payload = {
            nombre: form.nombre.trim(),
            telefono: form.telefono.trim(),
            email: form.email.trim(),
            direccion: form.direccion.trim(),
            rubro: form.rubro.trim(),
            notas: form.notas.trim(),
            etiquetas,
            negocio_id: negocio.id,
        };

        if (editCliente) {
            const { error } = await supabase.from('clientes').update(payload).eq('id', editCliente.id);
            if (error) { toast('Error al actualizar: ' + error.message, 'error'); return; }
            toast('Cliente actualizado');
        } else {
            const { error } = await supabase.from('clientes').insert([{ ...payload, ultimo_contacto: new Date().toISOString().split('T')[0] }]);
            if (error) { toast('Error al crear: ' + error.message, 'error'); return; }
            toast('Cliente creado');
        }
        setModalOpen(false);
        fetchData();
    };

    const confirmDelete = (id: string) => {
        setDeleteConfirmId(id);
    };

    // ── TAREA 3: Soft Delete — UPDATE deleted_at en lugar de DELETE ──────────
    const handleDelete = async () => {
        if (!deleteConfirmId) return;
        const { error } = await supabase
            .from('clientes')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', deleteConfirmId);
        if (error) { toast('Error al eliminar: ' + error.message, 'error'); setDeleteConfirmId(null); return; }
        toast('Cliente eliminado');
        setFichaOpen(null);
        setDeleteConfirmId(null);
        fetchData();
    };

    const handleExportCSV = () => {
        const data = filtered.map(c => ({
            Nombre: c.nombre,
            Teléfono: c.telefono,
            Email: c.email || '',
            Dirección: c.direccion || '',
            Rubro: c.rubro || '',
            Etiquetas: (c.etiquetas || []).join(', '),
            'Último Contacto': c.ultimo_contacto || '',
            'Fecha de Alta': c.created_at || '',
        }));
        exportToCSV(data, 'clientes');
        toast('CSV exportado');
    };

    const getClienteVentas = (clienteId: string) => ventas.filter(v => v.cliente_id === clienteId);

    if (loading) return <SkeletonTable rows={8} />;

    // ── TAREA 1: Empty State diferenciado ────────────────────────────────────
    const isReallyEmpty = clientes.length === 0 && !search && !filterTag && !filterInactivo;

    return (
        <div className="space-y-5 max-w-7xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Clientes</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{clientes.length} clientes registrados</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleExportCSV} className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        CSV
                    </button>
                    <button onClick={openCreateModal} className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        Nuevo Cliente
                    </button>
                </div>
            </div>

            {/* ── TAREA 1: Onboarding real (0 clientes, sin filtros activos) ── */}
            {isReallyEmpty ? (
                <EmptyState
                    icon={<IconUsers />}
                    title="Tu lista de clientes está vacía"
                    description="Agregá tu primer cliente para empezar a gestionar tu cartera y hacer seguimiento de ventas."
                    action={
                        <button onClick={openCreateModal} className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors flex items-center gap-2 mx-auto">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            Agregar primer cliente
                        </button>
                    }
                />
            ) : (
                <>
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar por nombre, teléfono o email..."
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/50 transition-all"
                            />
                        </div>
                        {allTags.length > 0 && (
                            <select
                                value={filterTag}
                                onChange={e => setFilterTag(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-600 dark:text-zinc-400 outline-none"
                            >
                                <option value="">Todas las etiquetas</option>
                                {allTags.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        )}
                        <button
                            onClick={() => setFilterInactivo(!filterInactivo)}
                            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${filterInactivo
                                ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400'
                                : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                                }`}
                        >
                            Inactivos (+60d)
                        </button>
                    </div>

                    {/* Sin resultados de filtro */}
                    {filtered.length === 0 ? (
                        <EmptyState
                            title="Sin resultados"
                            description="No se encontraron clientes con los filtros actuales. Probá con otro término o limpiá los filtros."
                            action={
                                <button onClick={() => { setSearch(''); setFilterTag(''); setFilterInactivo(false); }} className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                    Limpiar filtros
                                </button>
                            }
                        />
                    ) : (
                        <>
                            {/* ── TAREA 2: Vista Desktop (tabla) — oculta en mobile ── */}
                            <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-zinc-100 dark:border-zinc-800">
                                                {['Cliente', 'Teléfono', 'Etiquetas', 'Último Contacto', 'Total Comprado', ''].map(h => (
                                                    <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginated.map(c => {
                                                const cVentas = getClienteVentas(c.id);
                                                const totalComprado = cVentas.reduce((s, v) => s + (v.monto || 0), 0);
                                                const diasInactivo = daysSince(c.ultimo_contacto || c.created_at || new Date().toISOString());
                                                const isInactivo = diasInactivo > 60;

                                                return (
                                                    <tr key={c.id} className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer" onClick={() => setFichaOpen(c)}>
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isInactivo ? 'bg-red-100 dark:bg-red-500/10 text-red-500' : 'bg-orange-100 dark:bg-orange-500/10 text-orange-600'}`}>
                                                                    {c.nombre.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{c.nombre}</p>
                                                                    {c.email && <p className="text-[10px] text-zinc-400 truncate">{c.email}</p>}
                                                                </div>
                                                                {isInactivo && <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" title="Inactivo +60 días" />}
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm text-zinc-600 dark:text-zinc-400">{c.telefono || '—'}</span>
                                                                {c.telefono && (
                                                                    <a href={whatsappUrl(c.telefono)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-emerald-500 hover:text-emerald-600 transition-colors" title="WhatsApp">
                                                                        <IconWA />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex flex-wrap gap-1">
                                                                {(c.etiquetas || []).slice(0, 3).map(tag => (
                                                                    <Badge key={tag} variant={tag === 'VIP' ? 'orange' : tag === 'Moroso' ? 'danger' : 'default'}>{tag}</Badge>
                                                                ))}
                                                                {(c.etiquetas || []).length > 3 && <Badge>+{(c.etiquetas || []).length - 3}</Badge>}
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3.5 text-sm text-zinc-500 dark:text-zinc-400">
                                                            {c.ultimo_contacto ? formatDate(c.ultimo_contacto) : '—'}
                                                        </td>
                                                        <td className="px-5 py-3.5 text-sm font-semibold text-zinc-900 dark:text-white">
                                                            {formatCurrency(totalComprado)}
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <button
                                                                onClick={e => { e.stopPropagation(); openEditModal(c); }}
                                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"
                                                            >
                                                                <IconEdit />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="px-5 pb-3">
                                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                                </div>
                            </div>

                            {/* ── TAREA 2: Vista Mobile (Cards) — oculta en md+ ── */}
                            <div className="md:hidden space-y-3">
                                {paginated.map(c => {
                                    const cVentas = getClienteVentas(c.id);
                                    const totalComprado = cVentas.reduce((s, v) => s + (v.monto || 0), 0);
                                    const diasInactivo = daysSince(c.ultimo_contacto || c.created_at || new Date().toISOString());
                                    const isInactivo = diasInactivo > 60;

                                    return (
                                        <MobileCard key={c.id} onClick={() => setFichaOpen(c)}>
                                            {/* Cabecera del card */}
                                            <div className="flex items-center gap-3">
                                                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isInactivo ? 'bg-red-100 dark:bg-red-500/10 text-red-500' : 'bg-orange-100 dark:bg-orange-500/10 text-orange-600'}`}>
                                                    {c.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{c.nombre}</p>
                                                    {c.email && <p className="text-xs text-zinc-400 truncate">{c.email}</p>}
                                                </div>
                                                {isInactivo && <Badge variant="danger">Inactivo</Badge>}
                                                {(c.etiquetas || []).includes('VIP') && <Badge variant="orange">VIP</Badge>}
                                            </div>

                                            <MobileCardRow label="Teléfono">
                                                <span className="text-zinc-700 dark:text-zinc-300">{c.telefono || '—'}</span>
                                            </MobileCardRow>
                                            <MobileCardRow label="Ult. contacto">
                                                <span>{c.ultimo_contacto ? formatDate(c.ultimo_contacto) : '—'}</span>
                                            </MobileCardRow>
                                            <MobileCardRow label="Total comprado">
                                                <span className="font-semibold text-zinc-900 dark:text-white">{formatCurrency(totalComprado)}</span>
                                            </MobileCardRow>

                                            <MobileCardActions>
                                                {c.telefono && (
                                                    <a
                                                        href={whatsappUrl(c.telefono)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={e => e.stopPropagation()}
                                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
                                                    >
                                                        <IconWA /> WhatsApp
                                                    </a>
                                                )}
                                                <button
                                                    onClick={e => { e.stopPropagation(); openEditModal(c); }}
                                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                                >
                                                    <IconEdit /> Editar
                                                </button>
                                                <button
                                                    onClick={e => { e.stopPropagation(); confirmDelete(c.id); }}
                                                    className="flex items-center justify-center p-2.5 rounded-lg border border-red-200 dark:border-red-500/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                >
                                                    <IconTrash />
                                                </button>
                                            </MobileCardActions>
                                        </MobileCard>
                                    );
                                })}
                                <div className="pb-2">
                                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Create / Edit Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editCliente ? 'Editar Cliente' : 'Nuevo Cliente'} size="md">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Nombre *</label>
                        <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-400 transition-colors" placeholder="Nombre del cliente" autoFocus />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Teléfono</label>
                            <input type="tel" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-400 transition-colors" placeholder="+549..." />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Email</label>
                            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-400 transition-colors" placeholder="email@ejemplo.com" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Dirección</label>
                        <input type="text" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-400 transition-colors" placeholder="Dirección" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Rubro / Categoría</label>
                        <input type="text" value={form.rubro} onChange={e => setForm({ ...form, rubro: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-400 transition-colors" placeholder="Ej: Particular, Empresa, Taller..." />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Etiquetas <span className="text-zinc-400 font-normal">(separadas por coma)</span></label>
                        <input type="text" value={form.etiquetas} onChange={e => setForm({ ...form, etiquetas: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-400 transition-colors" placeholder="VIP, Frecuente, Moroso..." />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Notas internas</label>
                        <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-400 transition-colors resize-none" placeholder="Notas sobre el cliente..." />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancelar</button>
                        <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors">
                            {editCliente ? 'Guardar Cambios' : 'Crear Cliente'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Drawer Perfil del Cliente */}
            <ClientDrawer
                isOpen={!!fichaOpen}
                onClose={() => setFichaOpen(null)}
                cliente={fichaOpen}
                ventas={fichaOpen ? getClienteVentas(fichaOpen.id) : []}
                onEdit={openEditModal}
                onDelete={confirmDelete}
            />

            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="¿Archivar cliente?">
                <div className="space-y-4">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">El cliente será archivado y dejará de aparecer en la lista. Sus datos quedan guardados y pueden recuperarse desde la base de datos.</p>
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancelar</button>
                        <button onClick={handleDelete} className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">Archivar</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
