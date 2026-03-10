'use client';
import React, { useState } from 'react';
import FastEntryModal from './FastEntryModal';
import InvoiceDropzone from './InvoiceDropzone';
import { Cliente, Venta } from '@/types';

interface Props {
    clientes: Cliente[];
    ventas: Venta[];
    onAddData: (c: Omit<Cliente, 'id'>) => Promise<string | undefined>;
    onAddServicio: (clienteId: string, detalleProducto: string, monto: number, vendedor: string) => Promise<void>;
    isDarkMode: boolean;
    setIsDarkMode: (val: boolean) => void;
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    negocioNombre?: string;
    onLogout?: () => void;
}

export default function FastEntryBar({ clientes, ventas, onAddData, onAddServicio, isDarkMode, setIsDarkMode, searchTerm, setSearchTerm, negocioNombre, onLogout }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [dropzoneModalOpen, setDropzoneModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const suggestions = React.useMemo(() => {
        if (searchTerm.trim().length === 0) return [];
        const busqueda = searchTerm.toLowerCase();
        const hints: { label: string, value: string, type: string }[] = [];

        clientes.filter(c => c.nombre.toLowerCase().includes(busqueda)).slice(0, 3)
            .forEach(c => hints.push({ label: c.nombre, value: c.nombre, type: 'Cliente' }));

        const vendors = Array.from(new Set(ventas.map(v => v.vendedor).filter(Boolean))) as string[];
        vendors.filter(v => v.toLowerCase().includes(busqueda)).slice(0, 2)
            .forEach(v => hints.push({ label: v, value: v, type: 'Vendedor' }));

        return hints;
    }, [searchTerm, clientes, ventas]);

    const [extractedData, setExtractedData] = useState<any>(null);

    const handleExtracted = (data: any) => {
        setExtractedData(data);
        setDropzoneModalOpen(false);
        setModalOpen(true);
    };

    return (
        <>
            <header className="bg-white dark:bg-zinc-900 w-full px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                {/* Left: Logo + Business name */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
                    </div>
                    <div className="flex flex-col leading-tight">
                        <span className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">{negocioNombre || 'Mi Negocio'}</span>
                        <span className="text-[10px] text-zinc-400 font-medium tracking-wider uppercase">ITIRIUM CRM</span>
                    </div>
                </div>

                {/* Center: Search */}
                <div className="flex-1 max-w-md mx-6">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                            placeholder="Buscar cliente, vendedor..."
                            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                        />
                        {isDropdownOpen && suggestions.length > 0 && (
                            <ul className="absolute mt-1 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-50 overflow-hidden">
                                {suggestions.map((sug, i) => (
                                    <li
                                        key={i}
                                        onClick={() => { setSearchTerm(sug.value); setIsDropdownOpen(false); }}
                                        className="px-3 py-2.5 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer flex items-center justify-between"
                                    >
                                        <span>{sug.label}</span>
                                        <span className="text-xs text-zinc-400 font-medium">{sug.type}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setDropzoneModalOpen(true)}
                        className="inline-flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-700 hover:border-orange-300 dark:hover:border-orange-500/30 text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 font-medium px-3.5 py-2 rounded-lg transition-all text-sm"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                        Subir Factura
                    </button>
                    <button
                        type="button"
                        onClick={() => { setExtractedData(null); setModalOpen(true); }}
                        className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-medium px-3.5 py-2 rounded-lg transition-colors text-sm"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        Nueva Venta
                    </button>

                    <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1" />

                    <button
                        type="button"
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title={isDarkMode ? 'Modo claro' : 'Modo oscuro'}
                    >
                        {isDarkMode ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                        )}
                    </button>

                    {onLogout && (
                        <button
                            type="button"
                            onClick={onLogout}
                            className="p-2 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Cerrar sesión"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        </button>
                    )}
                </div>
            </header>

            <FastEntryModal
                clienteSearchTerm=""
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setExtractedData(null); }}
                clientes={clientes}
                ventas={ventas}
                onAddData={onAddData}
                onAddVenta={onAddServicio}
                initialScanData={extractedData}
            />

            {dropzoneModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-xl">
                        <div className="p-5 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800">
                            <h3 className="text-zinc-900 dark:text-white font-semibold text-base flex items-center gap-2">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                Cargar Factura
                            </h3>
                            <button onClick={() => setDropzoneModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                        <div className="p-8">
                            <InvoiceDropzone onExtracted={handleExtracted} clientes={clientes} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
