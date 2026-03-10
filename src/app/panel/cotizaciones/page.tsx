'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase-client';
import { useNegocio } from '@/contexts/NegocioContext';
import { useToast } from '@/contexts/ToastContext';
import { Cliente, Cotizacion, CotizacionItem } from '@/types';
import { formatCurrency, formatDate, whatsappUrl } from '@/utils/helpers';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/Skeleton';
import jsPDF from 'jspdf';

const ITEMS_PER_PAGE = 20;

export default function CotizacionesPage() {
    const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [editCot, setEditCot] = useState<Cotizacion | null>(null);
    const [clienteSearch, setClienteSearch] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const [form, setForm] = useState({
        cliente_id: '',
        cliente_nombre: '',
        items: [{ descripcion: '', cantidad: 1, precio_unitario: 0 }] as CotizacionItem[],
        descuento: 0,
        notas: '',
        validez_dias: 15,
        estado: 'borrador' as Cotizacion['estado'],
    });

    const supabase = createClient();
    const { negocio } = useNegocio();
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        const [cotRes, cRes] = await Promise.all([
            supabase.from('cotizaciones').select('*, cliente:clientes(nombre, telefono)').order('created_at', { ascending: false }),
            supabase.from('clientes').select('*').order('nombre'),
        ]);
        if (cotRes.data) setCotizaciones(cotRes.data as Cotizacion[]);
        if (cRes.data) setClientes(cRes.data as Cliente[]);
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        if (negocio) fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [negocio]);

    const getSubtotal = () => form.items.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0);
    const getTotal = () => getSubtotal() - form.descuento;

    const openCreate = () => {
        setEditCot(null);
        setForm({ cliente_id: '', cliente_nombre: '', items: [{ descripcion: '', cantidad: 1, precio_unitario: 0 }], descuento: 0, notas: '', validez_dias: 15, estado: 'borrador' });
        setClienteSearch('');
        setModalOpen(true);
    };

    const openEdit = (c: Cotizacion) => {
        setEditCot(c);
        const clienteNombre = c.cliente ? (c.cliente as unknown as { nombre: string }).nombre : '';
        setForm({
            cliente_id: c.cliente_id || '',
            cliente_nombre: clienteNombre,
            items: (c.items as CotizacionItem[]) || [{ descripcion: '', cantidad: 1, precio_unitario: 0 }],
            descuento: c.descuento || 0,
            notas: c.notas || '',
            validez_dias: c.validez_dias || 15,
            estado: c.estado,
        });
        setClienteSearch('');
        setModalOpen(true);
    };

    const addItem = () => setForm({ ...form, items: [...form.items, { descripcion: '', cantidad: 1, precio_unitario: 0 }] });
    const removeItem = (idx: number) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
    const updateItem = (idx: number, field: keyof CotizacionItem, value: string | number) => {
        const items = [...form.items];
        items[idx] = { ...items[idx], [field]: field === 'descripcion' ? value : Number(value) };
        setForm({ ...form, items });
    };

    const handleSave = async () => {
        if (!form.items.some(i => i.descripcion.trim())) { toast('Agregá al menos un item', 'error'); return; }
        if (!negocio) return;

        const payload = {
            negocio_id: negocio.id,
            cliente_id: form.cliente_id || null,
            items: form.items.filter(i => i.descripcion.trim()),
            descuento: form.descuento,
            total: getTotal(),
            notas: form.notas.trim(),
            validez_dias: form.validez_dias,
            estado: form.estado,
        };

        if (editCot) {
            const { error } = await supabase.from('cotizaciones').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editCot.id);
            if (error) { toast('Error: ' + error.message, 'error'); return; }
            toast('Cotización actualizada');
        } else {
            const { error } = await supabase.from('cotizaciones').insert([payload]);
            if (error) { toast('Error: ' + error.message, 'error'); return; }
            toast('Cotización creada');
        }
        setModalOpen(false);
        fetchData();
    };

    const confirmDelete = (id: string) => {
        setDeleteConfirmId(id);
    };

    const handleDelete = async () => {
        if (!deleteConfirmId) return;
        await supabase.from('cotizaciones').delete().eq('id', deleteConfirmId);
        toast('Cotización eliminada');
        setDeleteConfirmId(null);
        fetchData();
    };

    const handleConvertToVenta = async (cot: Cotizacion) => {
        if (!negocio || !cot.cliente_id) { toast('Se necesita un cliente para convertir', 'error'); return; }
        const { error } = await supabase.from('ventas').insert([{
            cliente_id: cot.cliente_id,
            detalle: (cot.items as CotizacionItem[]).map(i => `${i.cantidad}x ${i.descripcion}`).join(', '),
            monto: cot.total,
            vendedor: '',
            negocio_id: negocio.id,
            estado: 'pendiente',
            fecha: new Date().toISOString().split('T')[0],
        }]);
        if (error) { toast('Error: ' + error.message, 'error'); return; }
        await supabase.from('cotizaciones').update({ estado: 'aceptada', updated_at: new Date().toISOString() }).eq('id', cot.id);
        toast('Cotización convertida en venta');
        fetchData();
    };

    const generatePDF = (cot: Cotizacion) => {
        const doc = new jsPDF();
        const items = cot.items as CotizacionItem[];
        const clienteNombre = cot.cliente ? (cot.cliente as unknown as { nombre: string }).nombre : 'Cliente';

        // Header
        doc.setFontSize(22);
        doc.setTextColor(249, 115, 22);
        doc.text(negocio?.nombre || 'ITIRIUM', 20, 25);
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        doc.text('Cotización', 20, 33);

        // Client info
        doc.setFontSize(11);
        doc.setTextColor(40, 40, 40);
        doc.text(`Cliente: ${clienteNombre}`, 20, 48);
        doc.text(`Fecha: ${formatDate(cot.created_at)}`, 20, 55);
        doc.text(`Válida por: ${cot.validez_dias} días`, 20, 62);

        // Table header
        let y = 78;
        doc.setFillColor(245, 245, 245);
        doc.rect(20, y - 5, 170, 10, 'F');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text('Descripción', 22, y);
        doc.text('Cant.', 120, y);
        doc.text('P/U', 138, y);
        doc.text('Subtotal', 160, y);

        // Items
        y += 12;
        doc.setTextColor(40, 40, 40);
        items.forEach(item => {
            doc.text(item.descripcion.slice(0, 40), 22, y);
            doc.text(String(item.cantidad), 122, y);
            doc.text(formatCurrency(item.precio_unitario), 136, y);
            doc.text(formatCurrency(item.cantidad * item.precio_unitario), 158, y);
            y += 8;
        });

        // Totals
        y += 5;
        doc.setDrawColor(220, 220, 220);
        doc.line(120, y, 190, y);
        y += 8;
        const subtotal = items.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0);
        doc.text('Subtotal:', 130, y);
        doc.text(formatCurrency(subtotal), 158, y);
        if (cot.descuento > 0) {
            y += 8;
            doc.text('Descuento:', 130, y);
            doc.text(`-${formatCurrency(cot.descuento)}`, 158, y);
        }
        y += 10;
        doc.setFontSize(12);
        doc.setTextColor(249, 115, 22);
        doc.text('TOTAL:', 130, y);
        doc.text(formatCurrency(cot.total), 158, y);

        // Notes
        if (cot.notas) {
            y += 15;
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text('Notas:', 20, y);
            y += 6;
            doc.setTextColor(60, 60, 60);
            const lines = doc.splitTextToSize(cot.notas, 160);
            doc.text(lines, 20, y);
        }

        doc.save(`cotizacion_${clienteNombre.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
        toast('PDF generado');
    };

    const sendWhatsApp = (cot: Cotizacion) => {
        const items = cot.items as CotizacionItem[];
        const clienteData = cot.cliente as unknown as { nombre: string; telefono: string } | undefined;
        if (!clienteData?.telefono) { toast('El cliente no tiene teléfono', 'error'); return; }

        const text = `*Cotización — ${negocio?.nombre || 'Mi Negocio'}*\n\n` +
            items.map(i => `• ${i.cantidad}x ${i.descripcion}: ${formatCurrency(i.cantidad * i.precio_unitario)}`).join('\n') +
            (cot.descuento > 0 ? `\n\nDescuento: -${formatCurrency(cot.descuento)}` : '') +
            `\n\n*Total: ${formatCurrency(cot.total)}*` +
            `\nVálida por ${cot.validez_dias} días.` +
            (cot.notas ? `\n\n${cot.notas}` : '');

        window.open(whatsappUrl(clienteData.telefono, text), '_blank');
    };

    const totalPages = Math.ceil(cotizaciones.length / ITEMS_PER_PAGE);
    const paginated = cotizaciones.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const filteredClientes = clientes.filter(c => !clienteSearch || c.nombre.toLowerCase().includes(clienteSearch.toLowerCase()));

    const estadoMap: Record<string, { variant: 'default' | 'info' | 'success' | 'danger'; label: string }> = {
        borrador: { variant: 'default', label: 'Borrador' },
        enviada: { variant: 'info', label: 'Enviada' },
        aceptada: { variant: 'success', label: 'Aceptada' },
        rechazada: { variant: 'danger', label: 'Rechazada' },
    };

    if (loading) return <SkeletonTable rows={5} />;

    return (
        <div className="space-y-5 max-w-7xl mx-auto animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Cotizaciones</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{cotizaciones.length} cotizaciones</p>
                </div>
                <button onClick={openCreate} className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors flex items-center gap-2 self-start">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    Nueva Cotización
                </button>
            </div>

            {cotizaciones.length === 0 ? (
                <EmptyState title="Sin cotizaciones" description="Creá tu primera cotización para enviar a un cliente." action={<button onClick={openCreate} className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors">Crear Cotización</button>} />
            ) : (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                                    {['Fecha', 'Cliente', 'Items', 'Total', 'Estado', 'Acciones'].map(h => (
                                        <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map(cot => {
                                    const clienteNombre = cot.cliente ? (cot.cliente as unknown as { nombre: string }).nombre : '—';
                                    const items = (cot.items as CotizacionItem[]) || [];
                                    const est = estadoMap[cot.estado] || estadoMap.borrador;
                                    return (
                                        <tr key={cot.id} className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-5 py-3.5 text-sm text-zinc-500 whitespace-nowrap">{formatDate(cot.created_at)}</td>
                                            <td className="px-5 py-3.5 text-sm font-medium text-zinc-900 dark:text-white truncate max-w-[140px]">{clienteNombre}</td>
                                            <td className="px-5 py-3.5 text-sm text-zinc-500">{items.length} items</td>
                                            <td className="px-5 py-3.5 text-sm font-bold text-zinc-900 dark:text-white">{formatCurrency(cot.total)}</td>
                                            <td className="px-5 py-3.5"><Badge variant={est.variant}>{est.label}</Badge></td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => openEdit(cot)} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors" title="Editar">
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                    </button>
                                                    <button onClick={() => generatePDF(cot)} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors" title="PDF">
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                    </button>
                                                    <button onClick={() => sendWhatsApp(cot)} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors" title="WhatsApp">
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                                    </button>
                                                    {cot.estado !== 'aceptada' && cot.cliente_id && (
                                                        <button onClick={() => handleConvertToVenta(cot)} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors" title="Convertir a venta">
                                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                                                        </button>
                                                    )}
                                                    <button onClick={() => confirmDelete(cot.id)} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Eliminar">
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                    </button>
                                                </div>
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

            {/* Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editCot ? 'Editar Cotización' : 'Nueva Cotización'} size="lg">
                <div className="space-y-4">
                    {/* Cliente */}
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Cliente</label>
                        <input type="text" value={clienteSearch || form.cliente_nombre} onChange={e => { setClienteSearch(e.target.value); if (!e.target.value) setForm({ ...form, cliente_id: '', cliente_nombre: '' }); }} placeholder="Buscar cliente..." className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none focus:border-orange-400 transition-colors text-zinc-900 dark:text-white" />
                        {clienteSearch && (
                            <div className="mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg max-h-36 overflow-y-auto">
                                {filteredClientes.slice(0, 6).map(c => (
                                    <button key={c.id} onClick={() => { setForm({ ...form, cliente_id: c.id, cliente_nombre: c.nombre }); setClienteSearch(''); }} className="w-full text-left px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-sm text-zinc-900 dark:text-white transition-colors">{c.nombre}</button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Items */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Items</label>
                            <button onClick={addItem} className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors">+ Agregar item</button>
                        </div>
                        <div className="space-y-2">
                            {form.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <input type="text" value={item.descripcion} onChange={e => updateItem(idx, 'descripcion', e.target.value)} placeholder="Descripción" className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none focus:border-orange-400 transition-colors text-zinc-900 dark:text-white" />
                                    <input type="number" value={item.cantidad || ''} onChange={e => updateItem(idx, 'cantidad', e.target.value)} className="w-16 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-center outline-none text-zinc-900 dark:text-white" placeholder="Cant." />
                                    <input type="number" value={item.precio_unitario || ''} onChange={e => updateItem(idx, 'precio_unitario', e.target.value)} className="w-24 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-right outline-none text-zinc-900 dark:text-white" placeholder="Precio" />
                                    <span className="text-sm font-semibold text-zinc-500 w-24 text-right">{formatCurrency(item.cantidad * item.precio_unitario)}</span>
                                    {form.items.length > 1 && (
                                        <button onClick={() => removeItem(idx)} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-300 hover:text-red-500 transition-colors">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Subtotal</span>
                            <span className="font-semibold text-zinc-900 dark:text-white">{formatCurrency(getSubtotal())}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-500">Descuento</span>
                            <input type="number" value={form.descuento || ''} onChange={e => setForm({ ...form, descuento: Number(e.target.value) || 0 })} className="w-28 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-right outline-none text-zinc-900 dark:text-white" placeholder="0" />
                        </div>
                        <div className="flex justify-between text-base font-bold border-t border-zinc-200 dark:border-zinc-700 pt-2">
                            <span className="text-zinc-900 dark:text-white">Total</span>
                            <span className="text-orange-500">{formatCurrency(getTotal())}</span>
                        </div>
                    </div>

                    {/* Extra fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Validez (días)</label>
                            <input type="number" value={form.validez_dias} onChange={e => setForm({ ...form, validez_dias: Number(e.target.value) || 15 })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none text-zinc-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Estado</label>
                            <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value as Cotizacion['estado'] })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none text-zinc-900 dark:text-white">
                                <option value="borrador">Borrador</option>
                                <option value="enviada">Enviada</option>
                                <option value="aceptada">Aceptada</option>
                                <option value="rechazada">Rechazada</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Notas</label>
                        <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none resize-none text-zinc-900 dark:text-white" placeholder="Notas adicionales..." />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancelar</button>
                        <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors">
                            {editCot ? 'Guardar' : 'Crear Cotización'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="¿Eliminar esta cotización?">
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
