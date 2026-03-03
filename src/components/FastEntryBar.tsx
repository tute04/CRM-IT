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
}

export default function FastEntryBar({ clientes, ventas, onAddData, onAddServicio, isDarkMode, setIsDarkMode, searchTerm, setSearchTerm }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [dropzoneModalOpen, setDropzoneModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const suggestions = React.useMemo(() => {
        if (searchTerm.trim().length === 0) return [];
        const busqueda = searchTerm.toLowerCase();

        const hints: { label: string, value: string }[] = [];

        // Clientes matching
        const matchesClientes = clientes.filter(c => c.nombre.toLowerCase().includes(busqueda)).slice(0, 3);
        matchesClientes.forEach(c => hints.push({ label: `👤 Cliente: ${c.nombre}`, value: c.nombre }));

        // Vendedores matching
        const vendors = Array.from(new Set(ventas.map(v => v.vendedor).filter(Boolean))) as string[];
        const matchesVendedores = vendors.filter(v => v.toLowerCase().includes(busqueda)).slice(0, 3);
        matchesVendedores.forEach(v => hints.push({ label: `💼 Vendedor: ${v}`, value: v }));

        // Añadimos fechas también si alguien busca un año 
        const matchesFechas = Array.from(new Set(ventas.map(v => v.fecha))).filter(f => f.includes(busqueda)).slice(0, 2);
        matchesFechas.forEach(f => hints.push({ label: `📅 Fecha: ${f}`, value: f }));

        return hints;
    }, [searchTerm, clientes, ventas]);

    const handleSelectSuggestion = (value: string) => {
        setSearchTerm(value);
        setIsDropdownOpen(false);
    };

    const [extractedData, setExtractedData] = useState<any>(null);

    const handleExtracted = (data: any) => {
        setExtractedData(data);
        setDropzoneModalOpen(false);
        setModalOpen(true);
    };

    return (
        <>
            <div className="bg-white dark:bg-neutral-900 w-full p-4 shadow-sm border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between transition-colors duration-300">
                <div className="flex items-center gap-4 mr-8">
                    <div className="text-gray-900 dark:text-white font-bold tracking-tight flex flex-col leading-none">
                        <span className="text-sm text-yellow-500 dark:text-yellow-400 font-bold mb-1">NEUMÁTICOS</span>
                        <span className="text-3xl font-black leading-none">BONAVIA<span className="text-yellow-500 text-sm align-top ml-1">CRM</span></span>
                    </div>
                    <button type="button" onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 ml-4 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors text-xl shadow-inner">
                        {isDarkMode ? '🌙' : '☀️'}
                    </button>
                </div>

                <div className="flex-1 flex justify-end items-center gap-4 max-w-3xl">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                            placeholder="🔎 Buscar cliente, vendedor o fecha (Ej: Mateo, Tute, 2026)..."
                            className="bg-neutral-900 border border-neutral-800 text-white px-4 py-2 rounded-lg w-[32rem] focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400 transition-colors shadow-sm"
                        />
                        {isDropdownOpen && suggestions.length > 0 && (
                            <ul className="absolute mt-1 w-full bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl z-50 overflow-hidden divide-y divide-neutral-800">
                                {suggestions.map((sug, i) => (
                                    <li
                                        key={i}
                                        onClick={() => handleSelectSuggestion(sug.value)}
                                        className="px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-neutral-800 cursor-pointer transition-colors"
                                    >
                                        {sug.label}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setDropzoneModalOpen(true)}
                        className={`border border-yellow-400 text-yellow-500 hover:bg-yellow-400 hover:text-black font-black px-6 py-2 rounded-lg shadow-lg transition-colors uppercase tracking-wide whitespace-nowrap flex items-center justify-center min-w-[180px]`}
                    >
                        📥 Subir Factura
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setExtractedData(null); // Clean previous extractions
                            setModalOpen(true);
                        }}
                        className="bg-yellow-400 hover:bg-yellow-500 text-black font-black px-6 py-2 rounded-lg shadow-lg transition-colors uppercase tracking-wide whitespace-nowrap"
                    >
                        ➕ Cargar Venta
                    </button>
                </div>
            </div>

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
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 transition-all duration-300">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col transition-colors duration-300">
                        <div className="bg-neutral-950 p-5 flex justify-between items-center border-b border-neutral-800 transition-colors duration-300">
                            <h3 className="text-white font-bold text-lg tracking-wide uppercase flex items-center gap-2">
                                <span className="text-2xl">🪄</span> Carga de Recibo Mágica
                            </h3>
                            <button onClick={() => setDropzoneModalOpen(false)} className="text-neutral-400 hover:text-yellow-400 font-bold text-2xl transition-colors duration-300 ease-out leading-none">&times;</button>
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
