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

const ITEMS_PER_PAGE = 20;

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
    const supabase = createClient();
    const { negocio } = useNegocio();
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        const [cRes, vRes] = await Promise.all([
            supabase.from('clientes').select('*').order('nombre'),
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

    // All unique tags
    const allTags = [...new Set(clientes.flatMap(c => c.etiquetas || []))].sort();

    // Filter
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

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este cliente? Se eliminarán también sus ventas asociadas.')) return;
        const { error } = await supabase.from('clientes').delete().eq('id', id);
        if (error) { toast('Error al eliminar: ' + error.message, 'error'); return; }
        toast('Cliente eliminado');
        setFichaOpen(null);
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

            {/* Table */}
            {filtered.length === 0 ? (
                <EmptyState
                    title="Sin clientes"
                    description={search ? 'No se encontraron resultados para tu búsqueda.' : 'Agregá tu primer cliente para empezar.'}
                    action={
                        !search && (
                            <button onClick={openCreateModal} className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors">
                                Agregar Cliente
                            </button>
                        )
                    }
                />
            ) : (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
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
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isInactivo ? 'bg-red-100 dark:bg-red-500/10 text-red-500' : 'bg-orange-100 dark:bg-orange-500/10 text-orange-600'
                                                        }`}>
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
                                                        <a
                                                            href={whatsappUrl(c.telefono)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={e => e.stopPropagation()}
                                                            className="text-emerald-500 hover:text-emerald-600 transition-colors"
                                                            title="WhatsApp"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
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
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
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

            {/* Ficha Modal */}
            <Modal isOpen={!!fichaOpen} onClose={() => setFichaOpen(null)} title={fichaOpen?.nombre || ''} size="lg">
                {fichaOpen && (() => {
                    const cVentas = getClienteVentas(fichaOpen.id);
                    const totalComprado = cVentas.reduce((s, v) => s + (v.monto || 0), 0);
                    return (
                        <div className="space-y-5">
                            {/* Info cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
                                    <p className="text-[10px] font-semibold text-zinc-400 uppercase">Teléfono</p>
                                    <p className="text-sm font-medium text-zinc-900 dark:text-white mt-0.5">{fichaOpen.telefono || '—'}</p>
                                </div>
                                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
                                    <p className="text-[10px] font-semibold text-zinc-400 uppercase">Email</p>
                                    <p className="text-sm font-medium text-zinc-900 dark:text-white mt-0.5 truncate">{fichaOpen.email || '—'}</p>
                                </div>
                                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
                                    <p className="text-[10px] font-semibold text-zinc-400 uppercase">Total Comprado</p>
                                    <p className="text-sm font-bold text-emerald-600 mt-0.5">{formatCurrency(totalComprado)}</p>
                                </div>
                                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
                                    <p className="text-[10px] font-semibold text-zinc-400 uppercase">Último Contacto</p>
                                    <p className="text-sm font-medium text-zinc-900 dark:text-white mt-0.5">{fichaOpen.ultimo_contacto ? formatDate(fichaOpen.ultimo_contacto) : '—'}</p>
                                </div>
                            </div>

                            {fichaOpen.direccion && (
                                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
                                    <p className="text-[10px] font-semibold text-zinc-400 uppercase">Dirección</p>
                                    <p className="text-sm text-zinc-900 dark:text-white mt-0.5">{fichaOpen.direccion}</p>
                                </div>
                            )}

                            {(fichaOpen.etiquetas || []).length > 0 && (
                                <div className="flex flex-wrap gap-1.5">{(fichaOpen.etiquetas || []).map(t => <Badge key={t} variant="orange" size="md">{t}</Badge>)}</div>
                            )}

                            {fichaOpen.notas && (
                                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
                                    <p className="text-[10px] font-semibold text-zinc-400 uppercase mb-1">Notas</p>
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{fichaOpen.notas}</p>
                                </div>
                            )}

                            {/* Historial de ventas */}
                            <div>
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-3">Historial de Ventas ({cVentas.length})</h4>
                                {cVentas.length > 0 ? (
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {cVentas.map(v => (
                                            <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800">
                                                <div className="min-w-0">
                                                    <p className="text-sm text-zinc-900 dark:text-white truncate">{v.detalle}</p>
                                                    <p className="text-[10px] text-zinc-400">{formatDate(v.fecha)} · {v.vendedor || 'Sin vendedor'}</p>
                                                </div>
                                                <div className="text-right shrink-0 ml-3">
                                                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{formatCurrency(v.monto)}</p>
                                                    <Badge variant={v.estado === 'cobrada' ? 'success' : v.estado === 'pendiente' ? 'warning' : 'danger'}>{v.estado}</Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-zinc-400 text-center py-4">Sin ventas registradas</p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                {fichaOpen.telefono && (
                                    <a href={whatsappUrl(fichaOpen.telefono)} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors flex items-center gap-2">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                        WhatsApp
                                    </a>
                                )}
                                <button onClick={() => { setFichaOpen(null); openEditModal(fichaOpen); }} className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                    Editar
                                </button>
                                <button onClick={() => handleDelete(fichaOpen.id)} className="px-4 py-2 rounded-lg border border-red-200 dark:border-red-500/20 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors ml-auto">
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </Modal>
        </div>
    );
}
