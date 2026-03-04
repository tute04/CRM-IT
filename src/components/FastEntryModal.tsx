'use client';
import React, { useState, useEffect } from 'react';
import { Cliente, Venta } from '@/types';
import { supabase } from '@/utils/supabase';

interface Props {
    clienteSearchTerm: string;
    isOpen: boolean;
    onClose: () => void;
    clientes: Cliente[];
    ventas: Venta[];
    onAddData: (c: Omit<Cliente, 'id'>) => Promise<string | undefined>;
    onAddVenta: (clienteId: string, detalleProducto: string, monto: number, vendedor: string) => Promise<void>;
    initialScanData?: {
        nombre_cliente?: string;
        telefono?: string;
        detalle?: string;
        monto?: number;
        vendedor?: string;
    } | null;
}

export default function FastEntryModal({ clienteSearchTerm, isOpen, onClose, clientes, ventas, onAddData, onAddVenta, initialScanData }: Props) {
    // Combobox (Buscador Inteligente) States
    const [searchTerm, setSearchTerm] = useState(clienteSearchTerm);
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isCreatingNew, setIsCreatingNew] = useState(false);

    // Estados para Alta Nueva
    const [celular, setCelular] = useState('');

    // Estados para Nueva Venta
    const [tarea, setTarea] = useState('');
    const [monto, setMonto] = useState('');
    const [vendedor, setVendedor] = useState('');

    const [filtroVendedorBusqueda, setFiltroVendedorBusqueda] = useState('');
    const [filtroFecha, setFiltroFecha] = useState('');
    const [ventaAEditar, setVentaAEditar] = useState<Venta | null>(null);

    // Estado de Simulación IA
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Limpiar y sincronizar campos al abrir
    useEffect(() => {
        if (isOpen) {
            if (initialScanData) {
                // Modo Autocompletado IA
                setSearchTerm(initialScanData.nombre_cliente || '');
                setCelular(initialScanData.telefono || '');
                setTarea(initialScanData.detalle || '');
                setMonto(initialScanData.monto ? initialScanData.monto.toString() : '');
                setVendedor(initialScanData.vendedor || '');

                // Forzamos la sobreescritura limpia del estado aislando la data inicial del OCR
                setSelectedCliente(null);
                setSearchTerm(initialScanData.nombre_cliente?.trim() || '');
                setCelular(initialScanData.telefono?.trim() || '');
                setIsCreatingNew(true);
            } else {
                setSearchTerm(clienteSearchTerm);
                const coincidenciaExacta = clientes.find(c =>
                    c.nombre.toLowerCase() === clienteSearchTerm.toLowerCase() ||
                    c.telefono === clienteSearchTerm
                );
                if (coincidenciaExacta) {
                    setSelectedCliente(coincidenciaExacta);
                    setCelular(coincidenciaExacta.telefono);
                    setIsCreatingNew(false);
                } else {
                    setSelectedCliente(null);
                    setCelular('');
                    setIsCreatingNew(clienteSearchTerm.trim() !== ''); // Start creating if there's an initial unfound term
                }
                setTarea('');
                setMonto('');
                setVendedor('');
            }

            setIsDropdownOpen(false);
            setFiltroVendedorBusqueda('');
            setFiltroFecha('');
            setVentaAEditar(null);
            setIsAnalyzing(false);
            setIsSubmitting(false);
        }
    }, [isOpen, clienteSearchTerm, clientes, initialScanData]);

    if (!isOpen) return null;

    // Derived state for the combobox filtered list
    const filteredClientes = searchTerm.trim() === ''
        ? []
        : clientes.filter(c =>
            c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.telefono.includes(searchTerm)
        ).slice(0, 5); // Limit to top 5 for UI performance

    const clienteExistente = selectedCliente;

    const historialVentasBase = clienteExistente
        ? ventas.filter(v => v.cliente_id === clienteExistente.id).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        : [];

    const historialVentas = historialVentasBase.filter(v => {
        let regexVendedor = true;
        let regexFecha = true;
        if (filtroVendedorBusqueda.trim() !== '') {
            regexVendedor = (v.vendedor || '').toLowerCase().includes(filtroVendedorBusqueda.toLowerCase());
        }
        if (filtroFecha !== '') {
            regexFecha = new Date(v.fecha).toISOString().split('T')[0] === filtroFecha;
        }
        return regexVendedor && regexFecha;
    });

    const handleAlta = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const nuevoCliente = { nombre: searchTerm, telefono: celular };
        const realId = await onAddData(nuevoCliente);
        if (realId && tarea.trim() !== '') {
            await onAddVenta(realId, tarea, parseFloat(monto) || 0, vendedor);
        }
        setIsSubmitting(false);
        onClose();
    };

    const handleSelectCliente = (c: Cliente) => {
        setSelectedCliente(c);
        setSearchTerm(c.nombre);
        setCelular(c.telefono);
        setIsDropdownOpen(false);
        setIsCreatingNew(false);
    };

    const handleCreateNew = () => {
        setSelectedCliente(null);
        setCelular('');
        setIsDropdownOpen(false);
        setIsCreatingNew(true);
    };

    const handleClearSelection = () => {
        setSelectedCliente(null);
        setSearchTerm('');
        setCelular('');
        setIsCreatingNew(false);
        setIsDropdownOpen(true); // Re-open so they can search again
    };

    const handleVenta = async (e: React.FormEvent) => {
        e.preventDefault();
        if (clienteExistente) {
            setIsSubmitting(true);

            if (ventaAEditar) {
                const { error } = await supabase.from('ventas').update({
                    detalle: tarea,
                    monto: parseFloat(monto) || 0,
                    vendedor: vendedor
                }).eq('id', ventaAEditar.id);

                if (error) {
                    console.error("Error al actualizar venta:", error);
                    alert("Error al actualizar: " + error.message);
                } else {
                    setVentaAEditar(null);
                    setTarea('');
                    setMonto('');
                    setVendedor('');
                }
            } else {
                await onAddVenta(clienteExistente.id, tarea, parseFloat(monto) || 0, vendedor);
                setTarea('');
                setMonto('');
                setVendedor('');
            }
            setIsSubmitting(false);
        }
        // No cerramos el modal para permitir cargar o modificar otra
    };

    const simularLecturaIA = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            setTarea('4x Neumáticos Pirelli Scorpion 225/65 R17');
            setMonto('650000');
            setIsAnalyzing(false);
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200 dark:border-neutral-800 transition-colors duration-300">
                <div className="bg-gray-50 dark:bg-neutral-950 p-5 flex justify-between items-center border-b border-gray-200 dark:border-neutral-800 transition-colors duration-300">
                    <h3 className="text-gray-900 dark:text-white font-bold text-lg tracking-wide">
                        {clienteExistente ? `Ficha de Cliente: ${clienteExistente.nombre}` : `Alta de Cliente / Venta Rápida`}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 dark:text-neutral-400 hover:text-yellow-500 dark:hover:text-yellow-400 font-bold text-2xl transition-colors duration-300 ease-out leading-none">&times;</button>
                </div>

                <div className="overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent">
                    {/* BÚSQUEDA / SELECCIÓN COMBOBOX INTELIGENTE */}
                    <div className="mb-6 relative z-50">
                        <label className="block text-sm font-bold text-gray-500 dark:text-neutral-400 mb-2 uppercase tracking-wider">Cliente a Facturar</label>

                        {!selectedCliente && !isCreatingNew ? (
                            <div className="relative">
                                <input
                                    type="text"
                                    name="search-client-random-field"
                                    autoComplete="new-password"
                                    value={searchTerm}
                                    onChange={e => {
                                        setSearchTerm(e.target.value);
                                        setIsDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsDropdownOpen(true)}
                                    className="w-full px-4 py-3 bg-white dark:bg-neutral-950 border border-gray-300 dark:border-neutral-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 focus:outline-none transition-all duration-300 ease-out placeholder-gray-400 dark:placeholder-neutral-500 font-medium text-lg shadow-sm"
                                    placeholder="Buscar cliente por nombre o teléfono..."
                                />

                                {isDropdownOpen && searchTerm.trim() !== '' && (
                                    <ul className="absolute w-full z-50 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-2xl mt-2 max-h-56 overflow-y-auto overflow-x-hidden divide-y divide-gray-100 dark:divide-neutral-800">
                                        {filteredClientes.map(c => (
                                            <li
                                                key={c.id}
                                                onClick={() => handleSelectCliente(c)}
                                                className="p-4 hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer flex justify-between items-center group transition-colors"
                                            >
                                                <span className="text-gray-900 dark:text-white font-bold group-hover:text-yellow-600 dark:group-hover:text-yellow-400">{c.nombre}</span>
                                                <span className="text-gray-500 dark:text-neutral-500 font-medium text-sm">{c.telefono}</span>
                                            </li>
                                        ))}
                                        <li
                                            onClick={handleCreateNew}
                                            className="p-4 text-yellow-600 dark:text-yellow-400 bg-yellow-50/50 hover:bg-yellow-50 dark:bg-neutral-950 dark:hover:bg-neutral-800 cursor-pointer font-black flex items-center gap-2 transition-colors uppercase text-sm tracking-wide"
                                        >
                                            <span className="text-lg leading-none">+</span> Crear nuevo cliente: "{searchTerm}"
                                        </li>
                                    </ul>
                                )}
                            </div>
                        ) : (
                            // MODO SELECCIONADO / MODO CREACIÓN
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="search-client-random-field"
                                        autoComplete="new-password"
                                        value={searchTerm}
                                        readOnly
                                        className={`w-full px-4 py-3 border rounded-xl font-bold cursor-not-allowed transition-all shadow-sm pr-12 ${isCreatingNew ? 'bg-yellow-50 dark:bg-yellow-400/10 border-yellow-200 dark:border-yellow-500/30 text-yellow-800 dark:text-yellow-400' : 'bg-gray-100 dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-500 dark:text-gray-300'}`}
                                    />
                                    {isCreatingNew && (
                                        <div className="absolute -top-3 left-4 bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest shadow-sm">Nuevo</div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleClearSelection}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-gray-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400"
                                        title="Cambiar u Olvidar Selección"
                                    >
                                        ❌
                                    </button>
                                </div>
                                <div>
                                    <input
                                        type="tel"
                                        name="phone-random-field"
                                        autoComplete="new-password"
                                        required
                                        value={celular}
                                        onChange={e => setCelular(e.target.value)}
                                        readOnly={!isCreatingNew}
                                        className={`w-full px-4 py-3 border rounded-xl font-medium focus:outline-none transition-all shadow-sm placeholder-gray-400 dark:placeholder-neutral-500 ${isCreatingNew ? 'bg-white dark:bg-neutral-950 border-gray-300 dark:border-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400' : 'bg-gray-100 dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
                                        placeholder="Tipeá su WhatsApp / Teléfono..."
                                    />
                                    {selectedCliente && (
                                        <div className="absolute -top-3 right-4 bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest shadow-sm">Guardado</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {isCreatingNew && (
                        /* FORMULARIO DE ALTA RÁPIDA (SOLO APARECE SI isCreatingNew === true) */
                        <form onSubmit={handleAlta} className="flex flex-col gap-5 text-gray-900 dark:text-white transition-colors duration-300">
                            <div className="mt-2 pt-5 border-t border-gray-200 dark:border-neutral-800 transition-colors duration-300">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 tracking-wide">Primera Venta (Opcional)</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 dark:text-neutral-500 mb-1 uppercase tracking-wider">Producto o Detalle</label><input type="text" value={tarea} onChange={e => setTarea(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-gray-300 dark:border-neutral-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 focus:outline-none transition-all duration-300 ease-out text-sm placeholder-gray-400 dark:placeholder-neutral-500" placeholder="Ej: 4 Cubiertas Pirelli" /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 dark:text-neutral-500 mb-1 uppercase tracking-wider">Vendedor</label><input type="text" value={vendedor} onChange={e => setVendedor(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-gray-300 dark:border-neutral-800 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 focus:outline-none transition-all duration-300 ease-out text-sm placeholder-gray-400 dark:placeholder-neutral-500" placeholder="Ej: Tute" /></div>
                                    <div className="col-span-3"><label className="block text-xs font-bold text-gray-500 dark:text-neutral-500 mb-1 uppercase tracking-wider">Total Facturado $</label><input type="number" value={monto} onChange={e => setMonto(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-gray-300 dark:border-neutral-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 focus:outline-none transition-all duration-300 ease-out text-sm font-mono placeholder-gray-400 dark:placeholder-neutral-500" placeholder="0" /></div>
                                </div>
                            </div>
                            <button type="submit" className="relative overflow-hidden mt-4 w-full py-3 px-6 bg-yellow-400 hover:bg-yellow-500 text-black font-black tracking-wide rounded-xl shadow-md hover:-translate-y-1 transition-all duration-300 ease-out border border-yellow-500">
                                <span className="relative z-10">Guardar Cliente y Venta</span>
                            </button>
                        </form>
                    )}

                    {selectedCliente && (
                        /* REGISTRO DE VENTA Y PANEL (SÍ EXISTE EL CLIENTE SELECCIONADO) */
                        <div className="flex flex-col gap-6 text-gray-900 dark:text-white transition-colors duration-300 border-t border-gray-200 dark:border-neutral-800 pt-6 mt-2">
                            {/* Historial de Compras */}
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wider">Historial de Compras</h4>

                                <div className="flex gap-4 mb-4 p-4 bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 transition-colors duration-300">
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-500 dark:text-neutral-500 font-bold uppercase">Filtrar por Vendedor</label>
                                        <input type="text" placeholder="Ej: Tute" value={filtroVendedorBusqueda} onChange={e => setFiltroVendedorBusqueda(e.target.value)} className="w-full bg-white dark:bg-neutral-950 border border-gray-300 dark:border-neutral-800 text-gray-900 dark:text-white p-2 rounded mt-1 focus:ring-1 focus:ring-yellow-400 outline-none transition-colors duration-300 text-sm placeholder-gray-400 dark:placeholder-neutral-500" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-500 dark:text-neutral-500 font-bold uppercase">Fecha de venta</label>
                                        <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} className="w-full bg-white dark:bg-neutral-950 border border-gray-300 dark:border-neutral-800 text-gray-900 dark:text-white p-2 rounded mt-1 [color-scheme:light] dark:[color-scheme:dark] focus:ring-1 focus:ring-yellow-400 outline-none transition-colors duration-300 text-sm" />
                                    </div>
                                </div>

                                {historialVentas.length > 0 ? (
                                    <div className="max-h-40 overflow-y-auto overflow-x-hidden border border-gray-200 dark:border-neutral-800 rounded-xl bg-gray-50 dark:bg-neutral-950 shadow-sm transition-colors duration-300">
                                        <table className="w-full text-sm text-left align-middle border-collapse divide-y divide-gray-200 dark:divide-neutral-800">
                                            <thead className="bg-white dark:bg-neutral-900 text-gray-500 dark:text-neutral-400 font-semibold sticky top-0 border-b border-gray-200 dark:border-neutral-800 transition-colors duration-300">
                                                <tr>
                                                    <th className="p-3 font-semibold uppercase text-[11px] tracking-wider">Fecha</th>
                                                    <th className="p-3 font-semibold uppercase text-[11px] tracking-wider">Producto</th>
                                                    <th className="p-3 font-semibold uppercase text-[11px] tracking-wider">Vendedor</th>
                                                    <th className="p-3 font-semibold uppercase text-[11px] tracking-wider text-right">Monto</th>
                                                    <th className="p-3 font-semibold uppercase text-[11px] tracking-wider text-center">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                                                {historialVentas.map((v) => (
                                                    <tr key={v.id} className="group hover:bg-white dark:hover:bg-neutral-900 transition-colors duration-300">
                                                        <td className="p-3 text-gray-500 dark:text-neutral-400">{new Date(v.fecha).toLocaleDateString('es-AR')}</td>
                                                        <td className="p-3 font-medium text-gray-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">{v.detalle}</td>
                                                        <td className="p-3 text-gray-500 dark:text-neutral-400 font-mono text-xs uppercase">{v.vendedor || '-'}</td>
                                                        <td className="p-3 text-gray-900 dark:text-white font-mono font-semibold text-right">${Number(v.monto || 0).toLocaleString('es-AR')}</td>
                                                        <td className="p-3 text-center">
                                                            <div className="flex items-center justify-center gap-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        setVentaAEditar(v);
                                                                        setTarea(v.detalle);
                                                                        setMonto(v.monto.toString());
                                                                        setVendedor(v.vendedor || '');
                                                                    }}
                                                                    className="text-yellow-500 hover:text-yellow-400 font-bold transition-transform hover:scale-110"
                                                                    title="Editar Venta"
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={async (e) => {
                                                                        e.preventDefault();
                                                                        if (window.confirm("¿Estás seguro de eliminar esta venta?")) {
                                                                            const { error } = await supabase.from('ventas').delete().eq('id', v.id);
                                                                            if (error) {
                                                                                console.error(error);
                                                                                alert("Error al borrar venta: " + error.message);
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="text-red-500 hover:text-red-400 font-bold transition-transform hover:scale-110"
                                                                    title="Borrar Venta"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-neutral-500 italic bg-gray-50 dark:bg-neutral-950 p-4 rounded-xl border border-gray-200 dark:border-neutral-800 border-dashed text-center transition-colors duration-300">No se encontraron ventas para los criterios seleccionados.</p>
                                )}
                            </div>

                            {/* Caja Mágica: OCR con IA */}
                            <div className="bg-gray-50 dark:bg-neutral-950 rounded-xl p-6 border border-gray-200 dark:border-neutral-800 shadow-sm relative overflow-hidden group transition-colors duration-300">
                                <div className="absolute top-0 right-0 bg-yellow-400 text-black text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest shadow-sm">
                                    IA Auto-Fill
                                </div>
                                <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2 text-lg">
                                    <span className="text-xl">🤖</span> Carga de Remito Automática
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-neutral-400 mb-5 leading-relaxed">
                                    Sube tu factura digital o tómale una foto. La IA extraerá los datos y autocompletará la venta por ti.
                                </p>

                                <button
                                    type="button"
                                    onClick={simularLecturaIA}
                                    disabled={isAnalyzing}
                                    className={`relative overflow-hidden w-full py-3 px-6 rounded-xl font-bold uppercase tracking-wide transition-all duration-300 ease-out border ${isAnalyzing
                                        ? 'bg-gray-200 dark:bg-neutral-900 text-gray-500 dark:text-neutral-500 border-gray-200 dark:border-neutral-800 cursor-wait'
                                        : 'bg-yellow-400 text-black border-transparent shadow-md hover:bg-yellow-500 hover:-translate-y-1'
                                        }`}
                                >
                                    {isAnalyzing && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent skew-x-12 translate-x-[-150%] animate-[shimmer_2s_infinite]"></div>
                                    )}
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {isAnalyzing ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4 text-gray-500 dark:text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                Extrayendo Documento...
                                            </>
                                        ) : '✨ Analizar Remito (IA)'}
                                    </span>
                                </button>
                            </div>

                            <div className="flex items-center gap-4 my-1 opacity-60">
                                <div className="h-px bg-gray-300 dark:bg-neutral-800 flex-1"></div>
                                <span className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest">O Carga Manual</span>
                                <div className="h-px bg-gray-300 dark:bg-neutral-800 flex-1"></div>
                            </div>

                            {/* Cargar Nueva Venta */}
                            <form onSubmit={handleVenta} className="bg-gray-50 dark:bg-neutral-950 p-6 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm transition-all duration-300 hover:shadow-md">
                                <h4 className={`font-bold mb-5 text-sm uppercase tracking-wider ${ventaAEditar ? 'text-yellow-500' : 'text-gray-900 dark:text-white'}`}>
                                    {ventaAEditar ? '✏️ Editar Venta Seleccionada' : 'Verificar y Registrar Venta'}
                                </h4>
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="col-span-2">
                                        <label className="block text-[11px] font-bold text-gray-500 dark:text-neutral-500 mb-1.5 uppercase tracking-widest">Producto Vendido</label>
                                        <input type="text" required value={tarea} onChange={e => setTarea(e.target.value)}
                                            className={`w-full px-4 py-3 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 focus:outline-none transition-all duration-500 ${isAnalyzing ? 'bg-gray-100 dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-500 dark:text-neutral-500' : 'bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-800 text-gray-900 dark:text-white'}`} placeholder="Ej: 2 Neumáticos Fate" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-[11px] font-bold text-gray-500 dark:text-neutral-500 mb-1.5 uppercase tracking-widest">Vendedor</label>
                                        <input type="text" required value={vendedor} onChange={e => setVendedor(e.target.value)}
                                            className={`w-full px-4 py-3 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 focus:outline-none transition-all duration-500 ${isAnalyzing ? 'bg-gray-100 dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-500 dark:text-neutral-500' : 'bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-800 text-gray-900 dark:text-white'}`} placeholder="Ej: Tute" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-[11px] font-bold text-gray-900 dark:text-white mb-1.5 uppercase tracking-widest">Total Facturado $</label>
                                        <input type="number" required value={monto} onChange={e => setMonto(e.target.value)}
                                            className={`w-full px-4 py-3 border rounded-xl text-sm font-bold font-mono focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 focus:outline-none transition-all duration-500 ${isAnalyzing ? 'bg-gray-100 dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-500 dark:text-neutral-500' : 'bg-yellow-50 dark:bg-yellow-400/10 border-yellow-200 dark:border-yellow-400/30 text-yellow-800 dark:text-yellow-400'}`} placeholder="0" />
                                    </div>
                                </div>
                                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                    <button type="submit" disabled={isSubmitting} className="relative overflow-hidden w-full sm:flex-1 py-3.5 px-6 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-black font-black tracking-wide rounded-xl shadow-md hover:-translate-y-1 transition-all duration-300 ease-out border border-yellow-500">
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {isSubmitting ? 'Guardando...' : ventaAEditar ? 'Guardar Cambios' : 'Completar Venta'}
                                        </span>
                                    </button>
                                    {ventaAEditar && (
                                        <button type="button" onClick={() => { setVentaAEditar(null); setTarea(''); setMonto(''); setVendedor(''); }} className="w-full sm:w-auto py-3.5 px-6 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-900 dark:text-white font-bold tracking-wide rounded-xl shadow-sm hover:-translate-y-1 transition-all duration-300 border border-gray-300 dark:border-neutral-700">
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
