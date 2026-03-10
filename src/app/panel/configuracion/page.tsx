'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase-client';
import { useNegocio } from '@/contexts/NegocioContext';
import { useToast } from '@/contexts/ToastContext';
import { Vendedor } from '@/types';
import Link from 'next/link';

export default function ConfiguracionPage() {
    const [form, setForm] = useState({ nombre: '', rubro: '', direccion: '', telefono: '', email: '', moneda: 'ARS' });
    const [vendedores, setVendedores] = useState<Vendedor[]>([]);
    const [newVendedorNombre, setNewVendedorNombre] = useState('');
    const [newVendedorEmail, setNewVendedorEmail] = useState('');
    const [saving, setSaving] = useState(false);

    const supabase = createClient();
    const { negocio, refreshNegocio, diasRestantes } = useNegocio();
    const { toast } = useToast();

    const fetchVendedores = useCallback(async () => {
        const { data } = await supabase.from('vendedores').select('*').order('nombre');
        if (data) setVendedores(data as Vendedor[]);
    }, [supabase]);

    useEffect(() => {
        if (negocio) {
            setForm({
                nombre: negocio.nombre || '',
                rubro: negocio.rubro || '',
                direccion: negocio.direccion || '',
                telefono: negocio.telefono || '',
                email: negocio.email || '',
                moneda: negocio.moneda || 'ARS',
            });
            fetchVendedores();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [negocio]);

    const handleSaveNegocio = async () => {
        if (!negocio) return;
        setSaving(true);
        const { error } = await supabase.from('negocios').update({
            nombre: form.nombre.trim(),
            rubro: form.rubro.trim(),
            direccion: form.direccion.trim(),
            telefono: form.telefono.trim(),
            email: form.email.trim(),
            moneda: form.moneda,
            updated_at: new Date().toISOString(),
        }).eq('id', negocio.id);
        setSaving(false);
        if (error) { toast('Error: ' + error.message, 'error'); return; }
        toast('Configuración guardada');
        refreshNegocio();
    };

    const handleAddVendedor = async () => {
        if (!newVendedorNombre.trim() || !negocio) return;
        const { error } = await supabase.from('vendedores').insert([{
            nombre: newVendedorNombre.trim(),
            email: newVendedorEmail.trim(),
            negocio_id: negocio.id,
        }]);
        if (error) { toast('Error: ' + error.message, 'error'); return; }
        toast('Vendedor agregado');
        setNewVendedorNombre('');
        setNewVendedorEmail('');
        fetchVendedores();
    };

    const handleDeleteVendedor = async (id: string) => {
        if (!confirm('¿Eliminar este vendedor?')) return;
        await supabase.from('vendedores').delete().eq('id', id);
        toast('Vendedor eliminado');
        fetchVendedores();
    };

    const planLabel = negocio?.plan === 'trial' ? 'Período de Prueba' : negocio?.plan === 'activo' ? 'Plan Activo' : 'Plan Vencido';
    const planColor = negocio?.plan === 'activo' ? 'text-emerald-500' : negocio?.plan === 'trial' ? 'text-orange-500' : 'text-red-500';

    return (
        <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Configuración</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Perfil del negocio, equipo y plan</p>
            </div>

            {/* Perfil del Negocio */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-orange-500"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                    Perfil del Negocio
                </h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Nombre del Negocio</label>
                            <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-400 transition-colors" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Rubro</label>
                            <input type="text" value={form.rubro} onChange={e => setForm({ ...form, rubro: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-400 transition-colors" placeholder="Ej: Neumáticos, Peluquería..." />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Dirección</label>
                        <input type="text" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-400 transition-colors" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Teléfono</label>
                            <input type="tel" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-400 transition-colors" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Email</label>
                            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-400 transition-colors" />
                        </div>
                    </div>
                    <div className="max-w-[200px]">
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Moneda</label>
                        <select value={form.moneda} onChange={e => setForm({ ...form, moneda: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none">
                            <option value="ARS">ARS — Peso Argentino</option>
                            <option value="USD">USD — Dólar</option>
                            <option value="EUR">EUR — Euro</option>
                        </select>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button onClick={handleSaveNegocio} disabled={saving} className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Equipo */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-orange-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                    Equipo de Vendedores
                </h2>
                <div className="space-y-3">
                    {vendedores.map(v => (
                        <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                            <div>
                                <p className="text-sm font-medium text-zinc-900 dark:text-white">{v.nombre}</p>
                                {v.email && <p className="text-xs text-zinc-400">{v.email}</p>}
                            </div>
                            <button onClick={() => handleDeleteVendedor(v.id)} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                            </button>
                        </div>
                    ))}
                    {vendedores.length === 0 && <p className="text-sm text-zinc-400 text-center py-3">Sin vendedores registrados</p>}
                </div>
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <input type="text" value={newVendedorNombre} onChange={e => setNewVendedorNombre(e.target.value)} placeholder="Nombre del vendedor" className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-400 transition-colors" />
                    <input type="email" value={newVendedorEmail} onChange={e => setNewVendedorEmail(e.target.value)} placeholder="Email (opcional)" className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-400 transition-colors" />
                    <button onClick={handleAddVendedor} className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors whitespace-nowrap">
                        Agregar
                    </button>
                </div>
            </div>

            {/* Plan */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-orange-500"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                    Plan y Suscripción
                </h2>
                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                    <div>
                        <p className={`text-sm font-bold ${planColor}`}>{planLabel}</p>
                        {negocio?.plan === 'trial' && diasRestantes !== null && (
                            <p className="text-xs text-zinc-400 mt-0.5">{diasRestantes} días restantes</p>
                        )}
                        {negocio?.plan === 'activo' && (
                            <p className="text-xs text-zinc-400 mt-0.5">Tu plan está activo y al día</p>
                        )}
                    </div>
                    {negocio?.plan !== 'activo' && (
                        <Link href="/suscripcion" className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors">
                            Suscribirse
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
