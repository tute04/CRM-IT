'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase-client';
import { useNegocio } from '@/contexts/NegocioContext';
import { useToast } from '@/contexts/ToastContext';
import { Cliente, Venta, Recordatorio } from '@/types';
import { formatCurrency, formatDate, daysSince } from '@/utils/helpers';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';

export default function AlertasPage() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [newDesc, setNewDesc] = useState('');
    const [newFecha, setNewFecha] = useState(new Date().toISOString().split('T')[0]);
    const [newClienteId, setNewClienteId] = useState('');
    const [clienteSearch, setClienteSearch] = useState('');
    const [showCompleted, setShowCompleted] = useState(false);
    const [completedRecordatorios, setCompletedRecordatorios] = useState<Recordatorio[]>([]);

    const supabase = createClient();
    const { negocio, diasRestantes } = useNegocio();
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        const [cRes, vRes, rRes, crRes] = await Promise.all([
            supabase.from('clientes').select('*'),
            supabase.from('ventas').select('*'),
            supabase.from('recordatorios').select('*, cliente:clientes(nombre)').eq('completado', false).order('fecha', { ascending: true }),
            supabase.from('recordatorios').select('*, cliente:clientes(nombre)').eq('completado', true).order('created_at', { ascending: false }).limit(20),
        ]);
        if (cRes.data) setClientes(cRes.data as Cliente[]);
        if (vRes.data) setVentas(vRes.data as Venta[]);
        if (rRes.data) setRecordatorios(rRes.data as Recordatorio[]);
        if (crRes.data) setCompletedRecordatorios(crRes.data as Recordatorio[]);
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        if (negocio) fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [negocio]);

    // Alertas
    const hoy = new Date();
    const clientesInactivos = clientes.filter(c => {
        const date = c.ultimo_contacto || c.created_at;
        return date && daysSince(date) > 30;
    });
    const ventasPendientesViejas = ventas.filter(v => v.estado === 'pendiente' && daysSince(v.fecha) > 7);
    const trialAlerta = negocio?.plan === 'trial' && diasRestantes !== null && diasRestantes <= 3;

    const handleAddRecordatorio = async () => {
        if (!newDesc.trim() || !negocio) return;
        const { error } = await supabase.from('recordatorios').insert([{
            negocio_id: negocio.id,
            descripcion: newDesc.trim(),
            fecha: newFecha,
            cliente_id: newClienteId || null,
        }]);
        if (error) { toast('Error: ' + error.message, 'error'); return; }
        toast('Recordatorio creado');
        setModalOpen(false);
        setNewDesc('');
        setNewClienteId('');
        setClienteSearch('');
        fetchData();
    };

    const handleComplete = async (id: string) => {
        await supabase.from('recordatorios').update({ completado: true }).eq('id', id);
        toast('Marcado como hecho');
        fetchData();
    };

    const handleDeleteRecordatorio = async (id: string) => {
        await supabase.from('recordatorios').delete().eq('id', id);
        toast('Recordatorio eliminado');
        fetchData();
    };

    const filteredClientes = clientes.filter(c => !clienteSearch || c.nombre.toLowerCase().includes(clienteSearch.toLowerCase()));

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Alertas y Recordatorios</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Seguimiento de clientes y pendientes</p>
                </div>
                <button onClick={() => setModalOpen(true)} className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors flex items-center gap-2 self-start">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    Nuevo Recordatorio
                </button>
            </div>

            {/* Alertas automáticas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Clientes inactivos */}
                <div className={`rounded-xl border p-5 ${clientesInactivos.length > 0 ? 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${clientesInactivos.length > 0 ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="17" y1="11" x2="22" y2="11" /></svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{clientesInactivos.length}</p>
                            <p className="text-xs text-zinc-500">Clientes inactivos (+30d)</p>
                        </div>
                    </div>
                    {clientesInactivos.length > 0 && (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {clientesInactivos.slice(0, 5).map(c => (
                                <div key={c.id} className="flex items-center justify-between text-xs">
                                    <span className="text-zinc-700 dark:text-zinc-300 truncate">{c.nombre}</span>
                                    <Badge variant="warning">{daysSince(c.ultimo_contacto || c.created_at || '')}d</Badge>
                                </div>
                            ))}
                            {clientesInactivos.length > 5 && <p className="text-[10px] text-zinc-400">+{clientesInactivos.length - 5} más</p>}
                        </div>
                    )}
                </div>

                {/* Ventas pendientes */}
                <div className={`rounded-xl border p-5 ${ventasPendientesViejas.length > 0 ? 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ventasPendientesViejas.length > 0 ? 'bg-red-100 dark:bg-red-500/10 text-red-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{ventasPendientesViejas.length}</p>
                            <p className="text-xs text-zinc-500">Pendientes (+7d)</p>
                        </div>
                    </div>
                    {ventasPendientesViejas.length > 0 && (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {ventasPendientesViejas.slice(0, 5).map(v => {
                                const c = clientes.find(cl => cl.id === v.cliente_id);
                                return (
                                    <div key={v.id} className="flex items-center justify-between text-xs">
                                        <span className="text-zinc-700 dark:text-zinc-300 truncate">{c?.nombre || 'Desconocido'}</span>
                                        <span className="font-semibold text-zinc-900 dark:text-white">{formatCurrency(v.monto)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Trial */}
                <div className={`rounded-xl border p-5 ${trialAlerta ? 'bg-orange-50 dark:bg-orange-500/5 border-orange-200 dark:border-orange-500/20' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${trialAlerta ? 'bg-orange-100 dark:bg-orange-500/10 text-orange-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">
                                {trialAlerta ? `¡${diasRestantes}d para vencer!` : negocio?.plan === 'activo' ? 'Plan Activo ✓' : `${diasRestantes ?? '—'}d restantes`}
                            </p>
                            <p className="text-xs text-zinc-500">Estado del plan</p>
                        </div>
                    </div>
                    {trialAlerta && (
                        <Link href="/suscripcion" className="block w-full text-center px-3 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors">
                            Suscribirse ahora
                        </Link>
                    )}
                </div>
            </div>

            {/* Para Hacer */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <h2 className="text-base font-bold text-zinc-900 dark:text-white">Para Hacer ({recordatorios.length} pendientes)</h2>
                    <button onClick={() => setShowCompleted(!showCompleted)} className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
                        {showCompleted ? 'Ocultar completados' : 'Ver completados'}
                    </button>
                </div>
                <div className="p-5">
                    {recordatorios.length === 0 && !showCompleted ? (
                        <EmptyState
                            title="Sin pendientes"
                            description="¡Todo al día! Creá un recordatorio para no olvidar nada."
                            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12" /></svg>}
                        />
                    ) : (
                        <div className="space-y-2">
                            {recordatorios.map(r => (
                                <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                                    <button onClick={() => handleComplete(r.id)} className="mt-0.5 w-5 h-5 rounded-md border-2 border-zinc-300 dark:border-zinc-600 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors shrink-0 flex items-center justify-center">
                                        <svg width="0" height="0" className="group-hover:w-3 group-hover:h-3 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-zinc-900 dark:text-white">{r.descripcion}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-zinc-400">{formatDate(r.fecha)}</span>
                                            {r.cliente && <span className="text-[10px] text-orange-500">{(r.cliente as unknown as { nombre: string }).nombre}</span>}
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteRecordatorio(r.id)} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-300 dark:text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </button>
                                </div>
                            ))}

                            {showCompleted && completedRecordatorios.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                    <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Completados</p>
                                    {completedRecordatorios.map(r => (
                                        <div key={r.id} className="flex items-center gap-3 p-2 text-sm text-zinc-400 line-through opacity-60">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                                            {r.descripcion}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal nuevo recordatorio */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo Recordatorio" size="sm">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Descripción *</label>
                        <input type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="¿Qué tenés que hacer?" className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none focus:border-orange-400 transition-colors text-zinc-900 dark:text-white" autoFocus />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Fecha</label>
                        <input type="date" value={newFecha} onChange={e => setNewFecha(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none text-zinc-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Cliente (opcional)</label>
                        <input type="text" value={clienteSearch} onChange={e => setClienteSearch(e.target.value)} placeholder="Buscar cliente..." className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none text-zinc-900 dark:text-white" />
                        {clienteSearch && (
                            <div className="mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg max-h-32 overflow-y-auto">
                                {filteredClientes.slice(0, 5).map(c => (
                                    <button key={c.id} onClick={() => { setNewClienteId(c.id); setClienteSearch(c.nombre); }} className="w-full text-left px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-sm text-zinc-900 dark:text-white">{c.nombre}</button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancelar</button>
                        <button onClick={handleAddRecordatorio} className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors">Crear</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
