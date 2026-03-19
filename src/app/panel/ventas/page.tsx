'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase-client';
import { useNegocio } from '@/contexts/NegocioContext';
import { useToast } from '@/contexts/ToastContext';
import { Cliente, Venta } from '@/types';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { exportToCSV } from '@/utils/csv-export';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/Skeleton';
import InvoiceDropzone from '@/components/InvoiceDropzone';
import { MobileCard, MobileCardRow, MobileCardActions } from '@/components/ui/MobileCard';

const ITEMS_PER_PAGE = 20;
type EstadoFilter = '' | 'cobrada' | 'pendiente' | 'cancelada';
type SortKey = 'fecha' | 'monto' | 'detalle' | 'vendedor';
type SortDir = 'asc' | 'desc';

// ─── Íconos inline ─────────────────────────────────────────────
const IconReceipt = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
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

export default function VentasPage() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterEstado, setFilterEstado] = useState<EstadoFilter>('');
    const [filterVendedor, setFilterVendedor] = useState('');
    const [filterFechaDesde, setFilterFechaDesde] = useState('');
    const [filterFechaHasta, setFilterFechaHasta] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('fecha');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [page, setPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [editVenta, setEditVenta] = useState<Venta | null>(null);
    const [form, setForm] = useState({ cliente_id: '', cliente_nombre: '', detalle: '', monto: '', vendedor: '', fecha: new Date().toISOString().split('T')[0], estado: 'cobrada' as Venta['estado'] });
    const [showNewCliente, setShowNewCliente] = useState(false);
    const [newClienteNombre, setNewClienteNombre] = useState('');
    const [newClienteTelefono, setNewClienteTelefono] = useState('');
    const [clienteSearch, setClienteSearch] = useState('');
    const [dropzoneOpen, setDropzoneOpen] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const supabase = createClient();
    const { negocio } = useNegocio();
    const { toast } = useToast();

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
            const sub = supabase.channel('ventas-page')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas' }, fetchData)
                .subscribe();
            return () => { supabase.removeChannel(sub); };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [negocio]);

    const allVendedores = [...new Set(ventas.map(v => v.vendedor).filter(Boolean))].sort();
    const getClienteName = (id: string) => clientes.find(c => c.id === id)?.nombre || 'Desconocido';

    const filtered = ventas.filter(v => {
        const matchSearch = !search || v.detalle?.toLowerCase().includes(search.toLowerCase()) || getClienteName(v.cliente_id).toLowerCase().includes(search.toLowerCase());
        const matchEstado = !filterEstado || v.estado === filterEstado;
        const matchVendedor = !filterVendedor || v.vendedor === filterVendedor;
        const matchFechaDesde = !filterFechaDesde || v.fecha >= filterFechaDesde;
        const matchFechaHasta = !filterFechaHasta || v.fecha <= filterFechaHasta;
        return matchSearch && matchEstado && matchVendedor && matchFechaDesde && matchFechaHasta;
    }).sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        if (sortKey === 'monto') return (a.monto - b.monto) * dir;
        const aVal = String((a as unknown as Record<string, unknown>)[sortKey] || '');
        const bVal = String((b as unknown as Record<string, unknown>)[sortKey] || '');
        return aVal.localeCompare(bVal) * dir;
    });

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const totalFiltered = filtered.reduce((s, v) => s + (v.monto || 0), 0);

    useEffect(() => { setPage(1); }, [search, filterEstado, filterVendedor, filterFechaDesde, filterFechaHasta]);

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('desc'); }
    };

    const SortIcon = ({ k }: { k: SortKey }) => sortKey === k ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="inline ml-1"><polyline points={sortDir === 'asc' ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} /></svg>
    ) : null;

    const openCreate = () => {
        setEditVenta(null);
        setForm({ cliente_id: '', cliente_nombre: '', detalle: '', monto: '', vendedor: '', fecha: new Date().toISOString().split('T')[0], estado: 'cobrada' });
        setShowNewCliente(false);
        setClienteSearch('');
        setModalOpen(true);
    };

    const openEdit = (v: Venta) => {
        setEditVenta(v);
        setForm({
            cliente_id: v.cliente_id,
            cliente_nombre: getClienteName(v.cliente_id),
            detalle: v.detalle || '',
            monto: String(v.monto || ''),
            vendedor: v.vendedor || '',
            fecha: v.fecha || new Date().toISOString().split('T')[0],
            estado: v.estado || 'cobrada',
        });
        setShowNewCliente(false);
        setClienteSearch('');
        setModalOpen(true);
    };

    const handleExtracted = (data: any) => {
        setDropzoneOpen(false);
        setEditVenta(null);

        let matchedClienteId = '';
        let matchedClienteName = data.nombre_cliente || '';
        let isNew = !!data.nombre_cliente;

        // Búsqueda inteligente de cliente existente por aproximación
        if (data.nombre_cliente && clientes.length > 0) {
            // Normaliza ignorando mayúsculas, espacios, puntos, comas, etc. ("Avant S. A." == "avantsa")
            const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
            const target = normalize(data.nombre_cliente);
            const found = clientes.find(c => normalize(c.nombre) === target);

            if (found) {
                matchedClienteId = found.id;
                matchedClienteName = found.nombre;
                isNew = false; // ¡El cliente existe! No creamos uno nuevo.
            }
        }

        setForm({
            cliente_id: matchedClienteId,
            cliente_nombre: matchedClienteName,
            detalle: data.detalle || '',
            monto: String(data.monto || ''),
            vendedor: data.vendedor || '',
            fecha: data.fecha || new Date().toISOString().split('T')[0],
            estado: 'cobrada' as Venta['estado']
        });
        
        setShowNewCliente(isNew);
        setNewClienteNombre(isNew ? (data.nombre_cliente || '') : '');
        setNewClienteTelefono(isNew ? (data.telefono || '') : '');
        setClienteSearch(matchedClienteName);
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.detalle.trim()) { toast('La descripción es obligatoria', 'error'); return; }
        if (!form.monto || isNaN(Number(form.monto))) { toast('Monto inválido', 'error'); return; }
        if (!negocio) return;

        let clienteId = form.cliente_id;

        if (showNewCliente && newClienteNombre.trim()) {
            const { data, error } = await supabase.from('clientes').insert([{
                nombre: newClienteNombre.trim(),
                telefono: newClienteTelefono.trim(),
                negocio_id: negocio.id,
                ultimo_contacto: new Date().toISOString().split('T')[0],
            }]).select().single();
            if (error) { toast('Error al crear cliente: ' + error.message, 'error'); return; }
            clienteId = data.id;
        }

        if (!clienteId) { toast('Seleccioná un cliente', 'error'); return; }

        const payload = {
            cliente_id: clienteId,
            detalle: form.detalle.trim(),
            monto: parseFloat(form.monto),
            vendedor: form.vendedor.trim(),
            fecha: form.fecha,
            estado: form.estado,
            negocio_id: negocio.id,
        };

        if (editVenta) {
            const { error } = await supabase.from('ventas').update(payload).eq('id', editVenta.id);
            if (error) { toast('Error: ' + error.message, 'error'); return; }
            toast('Venta actualizada');
        } else {
            const { error } = await supabase.from('ventas').insert([payload]);
            if (error) { toast('Error: ' + error.message, 'error'); return; }
            await supabase.from('clientes').update({ ultimo_contacto: form.fecha }).eq('id', clienteId);
            toast('Venta registrada');
        }
        setModalOpen(false);
        fetchData();
    };

    const confirmDelete = (id: string) => setDeleteConfirmId(id);

    const handleDelete = async () => {
        if (!deleteConfirmId) return;
        const { error } = await supabase.from('ventas').delete().eq('id', deleteConfirmId);
        if (error) { toast('Error: ' + error.message, 'error'); setDeleteConfirmId(null); return; }
        toast('Venta eliminada');
        setDeleteConfirmId(null);
        fetchData();
    };

    const handleExport = () => {
        const data = filtered.map(v => ({
            Fecha: v.fecha,
            Cliente: getClienteName(v.cliente_id),
            Detalle: v.detalle,
            Monto: v.monto,
            Vendedor: v.vendedor || '',
            Estado: v.estado || 'cobrada',
        }));
        exportToCSV(data, 'ventas');
        toast('CSV exportado');
    };

    const filteredClientes = clientes.filter(c => !clienteSearch || c.nombre.toLowerCase().includes(clienteSearch.toLowerCase()));

    if (loading) return <SkeletonTable rows={8} />;

    const estadoBadge = (estado: string) => {
        if (estado === 'cobrada') return <Badge variant="success">Cobrada</Badge>;
        if (estado === 'pendiente') return <Badge variant="warning">Pendiente</Badge>;
        return <Badge variant="danger">Cancelada</Badge>;
    };

    const hasActiveFilters = !!(search || filterEstado || filterVendedor || filterFechaDesde || filterFechaHasta);
    // ── TAREA 1: Empty State diferenciado ────────────────────────────────────
    const isReallyEmpty = ventas.length === 0 && !hasActiveFilters;

    return (
        <div className="space-y-5 max-w-7xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Ventas</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{filtered.length} ventas · Total: {formatCurrency(totalFiltered)}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleExport} className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        CSV
                    </button>
                    <button onClick={() => setDropzoneOpen(true)} className="px-3 py-2 rounded-lg border border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 text-sm font-medium transition-colors flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                        Escanear Factura
                    </button>
                    <button onClick={openCreate} className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        Nueva Venta
                    </button>
                </div>
            </div>

            {/* ── TAREA 1: Onboarding real (0 ventas, sin filtros) ── */}
            {isReallyEmpty ? (
                <EmptyState
                    icon={<IconReceipt />}
                    title="Aún no registraste ninguna venta"
                    description="Registrá tu primera venta para empezar a ver tus estadísticas, cobros pendientes y el historial de cada cliente."
                    action={
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <button onClick={openCreate} className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors flex items-center gap-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                Registrar primera venta
                            </button>
                            <button onClick={() => setDropzoneOpen(true)} className="px-5 py-2.5 rounded-lg border border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 text-sm font-medium transition-colors flex items-center gap-2">
                                Escanear factura
                            </button>
                        </div>
                    }
                />
            ) : (
                <>
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[200px] max-w-xs">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-orange-400 transition-colors" />
                        </div>
                        <select value={filterEstado} onChange={e => setFilterEstado(e.target.value as EstadoFilter)} className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-600 dark:text-zinc-400 outline-none">
                            <option value="">Todos los estados</option>
                            <option value="cobrada">Cobrada</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="cancelada">Cancelada</option>
                        </select>
                        {allVendedores.length > 0 && (
                            <select value={filterVendedor} onChange={e => setFilterVendedor(e.target.value)} className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-600 dark:text-zinc-400 outline-none">
                                <option value="">Todos los vendedores</option>
                                {allVendedores.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        )}
                        <input type="date" value={filterFechaDesde} onChange={e => setFilterFechaDesde(e.target.value)} className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-600 dark:text-zinc-400 outline-none" />
                        <span className="text-zinc-400 text-xs">a</span>
                        <input type="date" value={filterFechaHasta} onChange={e => setFilterFechaHasta(e.target.value)} className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-600 dark:text-zinc-400 outline-none" />
                    </div>

                    {/* Sin resultados de filtro */}
                    {filtered.length === 0 ? (
                        <EmptyState
                            title="Sin resultados"
                            description="No se encontraron ventas con los filtros actuales."
                            action={
                                <button onClick={() => { setSearch(''); setFilterEstado(''); setFilterVendedor(''); setFilterFechaDesde(''); setFilterFechaHasta(''); }} className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                    Limpiar filtros
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
                                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 cursor-pointer hover:text-zinc-600" onClick={() => toggleSort('fecha')}>Fecha<SortIcon k="fecha" /></th>
                                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Cliente</th>
                                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 cursor-pointer hover:text-zinc-600" onClick={() => toggleSort('detalle')}>Detalle<SortIcon k="detalle" /></th>
                                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 cursor-pointer hover:text-zinc-600" onClick={() => toggleSort('monto')}>Monto<SortIcon k="monto" /></th>
                                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 cursor-pointer hover:text-zinc-600" onClick={() => toggleSort('vendedor')}>Vendedor<SortIcon k="vendedor" /></th>
                                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Estado</th>
                                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginated.map(v => (
                                                <tr key={v.id} className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                                    <td className="px-5 py-3.5 text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{formatDate(v.fecha)}</td>
                                                    <td className="px-5 py-3.5 text-sm font-medium text-zinc-900 dark:text-white truncate max-w-[140px]">{getClienteName(v.cliente_id)}</td>
                                                    <td className="px-5 py-3.5 text-sm text-zinc-600 dark:text-zinc-400 truncate max-w-[200px]">{v.detalle}</td>
                                                    <td className="px-5 py-3.5 text-sm font-bold text-zinc-900 dark:text-white">{formatCurrency(v.monto)}</td>
                                                    <td className="px-5 py-3.5 text-sm text-zinc-500 dark:text-zinc-400">{v.vendedor || '—'}</td>
                                                    <td className="px-5 py-3.5">{estadoBadge(v.estado || 'cobrada')}</td>
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => openEdit(v)} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors">
                                                                <IconEdit />
                                                            </button>
                                                            <button onClick={() => confirmDelete(v.id)} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                                                <IconTrash />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="px-5 pb-3">
                                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                                </div>
                            </div>

                            {/* ── TAREA 2: Vista Mobile (Cards) — oculta en md+ ── */}
                            <div className="md:hidden space-y-3">
                                {paginated.map(v => (
                                    <MobileCard key={v.id}>
                                        {/* Cabecera */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{getClienteName(v.cliente_id)}</p>
                                                <p className="text-xs text-zinc-400 truncate mt-0.5">{v.detalle}</p>
                                            </div>
                                            {estadoBadge(v.estado || 'cobrada')}
                                        </div>

                                        <MobileCardRow label="Fecha">
                                            <span>{formatDate(v.fecha)}</span>
                                        </MobileCardRow>
                                        <MobileCardRow label="Monto">
                                            <span className="font-bold text-zinc-900 dark:text-white text-base">{formatCurrency(v.monto)}</span>
                                        </MobileCardRow>
                                        {v.vendedor && (
                                            <MobileCardRow label="Vendedor">
                                                <span>{v.vendedor}</span>
                                            </MobileCardRow>
                                        )}

                                        <MobileCardActions>
                                            <button
                                                onClick={() => openEdit(v)}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                            >
                                                <IconEdit /> Editar
                                            </button>
                                            <button
                                                onClick={() => confirmDelete(v.id)}
                                                className="flex items-center justify-center p-2.5 rounded-lg border border-red-200 dark:border-red-500/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                            >
                                                <IconTrash />
                                            </button>
                                        </MobileCardActions>
                                    </MobileCard>
                                ))}
                                <div className="pb-2">
                                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Create/Edit Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editVenta ? 'Editar Venta' : 'Nueva Venta'}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Cliente *</label>
                        {!showNewCliente ? (
                            <div>
                                <input type="text" value={clienteSearch || form.cliente_nombre} onChange={e => { setClienteSearch(e.target.value); if (!e.target.value) setForm({ ...form, cliente_id: '', cliente_nombre: '' }); }} placeholder="Buscar cliente..." className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-400 transition-colors" />
                                {clienteSearch && (
                                    <div className="mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg max-h-36 overflow-y-auto">
                                        {filteredClientes.slice(0, 8).map(c => (
                                            <button key={c.id} onClick={() => { setForm({ ...form, cliente_id: c.id, cliente_nombre: c.nombre }); setClienteSearch(''); }} className="w-full text-left px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-sm text-zinc-900 dark:text-white transition-colors truncate">
                                                {c.nombre}
                                            </button>
                                        ))}
                                        {filteredClientes.length === 0 && <p className="px-3 py-2 text-sm text-zinc-400">Sin resultados</p>}
                                    </div>
                                )}
                                <button type="button" onClick={() => setShowNewCliente(true)} className="mt-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                                    + Crear cliente nuevo
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                <input type="text" value={newClienteNombre} onChange={e => setNewClienteNombre(e.target.value)} placeholder="Nombre del cliente" className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none" />
                                <input type="tel" value={newClienteTelefono} onChange={e => setNewClienteTelefono(e.target.value)} placeholder="Teléfono (opcional)" className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none" />
                                <button type="button" onClick={() => { setShowNewCliente(false); setNewClienteNombre(''); setNewClienteTelefono(''); }} className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">← Seleccionar existente</button>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Descripción *</label>
                        <input type="text" value={form.detalle} onChange={e => setForm({ ...form, detalle: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-400 transition-colors" placeholder="Producto o servicio..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Monto *</label>
                            <input type="number" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-400 transition-colors" placeholder="0" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Vendedor</label>
                            <input type="text" value={form.vendedor} onChange={e => setForm({ ...form, vendedor: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-400 transition-colors" placeholder="Nombre del vendedor" list="vendedores-list" />
                            <datalist id="vendedores-list">{allVendedores.map(v => <option key={v} value={v} />)}</datalist>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Fecha</label>
                            <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-400 transition-colors" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Estado</label>
                            <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value as Venta['estado'] })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-400 transition-colors">
                                <option value="cobrada">Cobrada</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="cancelada">Cancelada</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancelar</button>
                        <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors">
                            {editVenta ? 'Guardar Cambios' : 'Registrar Venta'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Dropzone Modal */}
            {dropzoneOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-xl">
                        <div className="p-5 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800">
                            <h3 className="text-zinc-900 dark:text-white font-semibold text-base flex items-center gap-2">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                Escanear Factura
                            </h3>
                            <button onClick={() => setDropzoneOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                        <div className="p-8">
                            <InvoiceDropzone onExtracted={handleExtracted} clientes={clientes} />
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="¿Eliminar esta venta?">
                <div className="space-y-4">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Esta acción no se puede deshacer. Se eliminará el registro permanentemente.</p>
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancelar</button>
                        <button onClick={handleDelete} className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">Eliminar</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
