'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase-client';
import { useNegocio } from '@/contexts/NegocioContext';
import { useRouter } from 'next/navigation';
import { Cliente, Venta } from '@/types';
import { formatCurrency } from '@/utils/helpers';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';

interface HeaderProps {
    isDarkMode: boolean;
    setIsDarkMode: (val: boolean) => void;
}

export default function Header({ isDarkMode, setIsDarkMode }: HeaderProps) {
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ clientes: Cliente[]; ventas: Venta[] }>({ clientes: [], ventas: [] });
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();
    const { negocio, diasRestantes } = useNegocio();
    const router = useRouter();

    // Keyboard shortcut
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
            if (e.key === 'Escape') {
                setSearchOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    useEffect(() => {
        if (searchOpen) inputRef.current?.focus();
    }, [searchOpen]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setSearchOpen(false);
                setQuery('');
            }
        };
        if (searchOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [searchOpen]);

    const search = useCallback(async (q: string) => {
        if (!q.trim() || q.length < 2) {
            setResults({ clientes: [], ventas: [] });
            return;
        }
        setLoading(true);
        const [clientesRes, ventasRes] = await Promise.all([
            supabase.from('clientes').select('*').or(`nombre.ilike.%${q}%,telefono.ilike.%${q}%,email.ilike.%${q}%`).limit(5),
            supabase.from('ventas').select('*').or(`detalle.ilike.%${q}%,vendedor.ilike.%${q}%`).limit(5),
        ]);
        setResults({
            clientes: (clientesRes.data || []) as Cliente[],
            ventas: (ventasRes.data || []) as Venta[],
        });
        setLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => search(query), 300);
        return () => clearTimeout(timer);
    }, [query, search]);

    const hasResults = results.clientes.length > 0 || results.ventas.length > 0;

    return (
        <header className="h-16 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 lg:px-6 shrink-0 sticky top-0 z-30">
            {/* Mobile logo */}
            <div className="flex items-center gap-2.5 lg:hidden">
                <Logo size="sm" variant="dark" />
            </div>

            {/* Page title area - desktop only */}
            <div className="hidden lg:flex items-center px-4">
                <span className="text-sm font-medium text-white">{negocio?.nombre || 'Mi Negocio'}</span>
            </div>

            {/* Search + Actions */}
            <div className="flex items-center gap-2" ref={containerRef}>
                {/* Search */}
                <div className="relative">
                    <button
                        onClick={() => setSearchOpen(true)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50 text-zinc-400 dark:text-zinc-500 text-sm hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors w-48 lg:w-64"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <span className="truncate">Buscar...</span>
                        <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-700 px-1.5 py-0.5 rounded ml-auto border border-zinc-200 dark:border-zinc-600">
                            ⌘K
                        </kbd>
                    </button>

                    {/* Search dropdown */}
                    {searchOpen && (
                        <div className="absolute top-0 right-0 lg:left-0 w-[calc(100vw-2rem)] lg:w-96 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-2xl z-50 animate-scale-in overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 shrink-0" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="Buscar clientes, ventas..."
                                    className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none"
                                />
                                {query && (
                                    <button onClick={() => setQuery('')} className="text-zinc-400 hover:text-zinc-600">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </button>
                                )}
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {loading && (
                                    <div className="p-6 flex justify-center">
                                        <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                                {!loading && query.length >= 2 && !hasResults && (
                                    <div className="p-6 text-center text-sm text-zinc-400">
                                        No se encontraron resultados
                                    </div>
                                )}
                                {!loading && hasResults && (
                                    <>
                                        {results.clientes.length > 0 && (
                                            <div>
                                                <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Clientes</p>
                                                {results.clientes.map(c => (
                                                    <Link
                                                        key={c.id}
                                                        href={`/panel/clientes?highlight=${c.id}`}
                                                        onClick={() => { setSearchOpen(false); setQuery(''); }}
                                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 text-xs font-bold">
                                                            {c.nombre.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{c.nombre}</p>
                                                            <p className="text-xs text-zinc-400 truncate">{c.telefono}</p>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                        {results.ventas.length > 0 && (
                                            <div>
                                                <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Ventas</p>
                                                {results.ventas.map(v => (
                                                    <Link
                                                        key={v.id}
                                                        href={`/panel/ventas?highlight=${v.id}`}
                                                        onClick={() => { setSearchOpen(false); setQuery(''); }}
                                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 text-xs font-bold">$</div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{v.detalle}</p>
                                                            <p className="text-xs text-zinc-400">{formatCurrency(v.monto)}</p>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                                {!loading && query.length < 2 && (
                                    <div className="p-6 text-center text-xs text-zinc-400">
                                        Escribí al menos 2 caracteres para buscar
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Trial badge */}
                {negocio?.plan === 'trial' && diasRestantes !== null && (
                    <Link href="/suscripcion" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-500 text-xs font-semibold border border-orange-500/20 transition-colors">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                        {diasRestantes}d trial
                    </Link>
                )}

                {/* Dark Mode Toggle */}
                <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    {isDarkMode ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                    )}
                </button>
            </div>
        </header>
    );
}
