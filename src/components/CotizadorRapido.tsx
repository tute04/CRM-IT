'use client';
import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Cotizacion {
    titulo: string;
    costo: number;
    venta: number;
    stock: number;
    link: string;
}

export default function CotizadorRapido() {
    const [medida, setMedida] = useState('');
    const [loading, setLoading] = useState(false);
    const [resultados, setResultados] = useState<Cotizacion[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selecciones, setSelecciones] = useState<Record<number, { seleccionado: boolean; cantidad: number }>>({});

    const cotizar = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResultados([]);
        setSelecciones({});

        try {
            const res = await fetch(`/api/cotizar?medida=${encodeURIComponent(medida)}`);
            if (!res.ok) {
                throw new Error('Error al obtener cotizaciones o no se encontraron datos.');
            }
            const data: Cotizacion[] = await res.json();
            setResultados(data);
        } catch (err: any) {
            setError(err.message || 'Error desconocido al cotizar en tiempo real');
        } finally {
            setLoading(false);
        }
    };

    const copiarWhatsApp = () => {
        const validos = resultados.filter(r => r.stock !== 0);
        if (validos.length === 0) return;

        let textoCopiar = `👋 Hola! Te paso las opciones para ${medida}:\n\n`;
        validos.forEach(r => {
            textoCopiar += `🔘 ${r.titulo}\n💲 Precio Final: $${Math.round(r.venta).toLocaleString('es-AR')}\n\n`;
        });
        textoCopiar += `✅ Precios contado/transferencia.`;

        navigator.clipboard.writeText(textoCopiar).then(() => {
            alert('¡Opciones copiadas, listas para pegar en WhatsApp!');
        }).catch(err => {
            console.error('No se pudo copiar: ', err);
            alert('Error al copiar al portapapeles.');
        });
    };

    const generarPDF = () => {
        try {
            const doc = new jsPDF();

            // Título
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('PRESUPUESTO - NEUMÁTICOS BONAVIA', 105, 20, { align: 'center' });

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            doc.text(`Fecha: ${fecha}`, 190, 30, { align: 'right' });

            const seleccionados = resultados.map((r, idx) => ({ ...r, idx })).filter(r => selecciones[r.idx]?.seleccionado);
            if (seleccionados.length === 0) {
                alert("Selecciona al menos un producto para el PDF.");
                return;
            }

            let totalGeneral = 0;
            const tableData = seleccionados.map(item => {
                const cantidad = selecciones[item.idx].cantidad;
                const subtotal = item.venta * cantidad;
                totalGeneral += subtotal;

                return [
                    item.titulo,
                    cantidad.toString(),
                    `$${Math.round(item.venta).toLocaleString('es-AR')}`,
                    `$${Math.round(subtotal).toLocaleString('es-AR')}`
                ];
            });

            // Generar tabla
            autoTable(doc, {
                startY: 40,
                head: [['Descripción', 'Cantidad', 'Precio Unitario', 'Subtotal']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [40, 40, 40], textColor: 255, halign: 'center' },
                bodyStyles: { halign: 'center' },
                columnStyles: { 0: { halign: 'left' } }
            });

            const finalY = (doc as any).lastAutoTable?.finalY || 40;

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`TOTAL DEL PRESUPUESTO: $${Math.round(totalGeneral).toLocaleString('es-AR')}`, 190, finalY + 15, { align: 'right' });

            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.text('Nota: Precios de contado/transferencia.', 15, finalY + 30);
            doc.text('Validez del presupuesto: 24 hs.', 15, finalY + 35);

            doc.save('Presupuesto_Bonavia.pdf');
        } catch (error) {
            console.error("Error generando PDF:", error);
            alert("Hubo un error al generar el PDF.");
        }
    };

    return (
        <div className="bg-neutral-950 p-6 rounded-xl shadow-lg border border-neutral-800 transition-colors duration-300 h-full flex flex-col">
            <h3 className="text-xl font-black text-white mb-4 uppercase transition-colors tracking-tight">Motor Web Automático</h3>
            <form onSubmit={cotizar} className="flex flex-col gap-4 mb-4">
                <div>
                    <label className="block text-sm font-bold text-neutral-400 mb-1 uppercase tracking-wider">Buscar por Medida</label>
                    <input type="text" required value={medida} onChange={e => setMedida(e.target.value)} className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white font-medium focus:ring-2 focus:ring-yellow-400 focus:outline-none transition-colors placeholder-neutral-600 focus:bg-neutral-950" placeholder="Ej: 205/55 R16" />
                </div>
                <button type="submit" disabled={loading} className={`relative overflow-hidden w-full py-3.5 text-black font-black rounded-xl uppercase tracking-widest transition-all duration-300 shadow-md ${loading ? 'bg-yellow-500/50 cursor-wait' : 'bg-yellow-400 hover:bg-yellow-500 hover:-translate-y-1'}`}>
                    <span className="relative z-10">{loading ? '🔎 Espiando precios en tiempo real...' : 'Buscar en la Web'}</span>
                </button>
            </form>

            {error && (
                <div className="p-3 mb-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm font-semibold text-center border-dashed">
                    {error}
                </div>
            )}

            {!loading && resultados.length > 0 && (
                <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent pb-4 space-y-4">
                    <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-800 pb-2 mb-4 sticky top-0 bg-neutral-950/90 backdrop-blur-sm z-10 pt-2">Resultados en Tiempo Real</h4>
                    {resultados.map((r, idx) => (
                        <div key={idx} className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex flex-col gap-2 hover:border-yellow-400/30 transition-colors group">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        className="mt-1 w-5 h-5 accent-yellow-500 cursor-pointer flex-shrink-0"
                                        checked={selecciones[idx]?.seleccionado || false}
                                        onChange={(e) => setSelecciones(prev => ({
                                            ...prev,
                                            [idx]: {
                                                seleccionado: e.target.checked,
                                                cantidad: prev[idx]?.cantidad || 4
                                            }
                                        }))}
                                    />
                                    <h4 className="text-white font-bold text-sm leading-tight group-hover:text-yellow-400 transition-colors">{r.titulo}</h4>
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-wider whitespace-nowrap px-2 py-1 border rounded-md ${r.stock === 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' : r.stock > 0 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                                    {r.stock === 0 ? '⚠️ Agotado' : r.stock > 0 ? `✅ Stock: ${r.stock}` : '❓ Confirmar Stock'}
                                </span>
                            </div>
                            <div className="flex justify-between items-end mt-2">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col gap-1 items-center bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                                        <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Cant.</label>
                                        <input
                                            type="number"
                                            min="1"
                                            disabled={!selecciones[idx]?.seleccionado}
                                            value={selecciones[idx]?.cantidad || 4}
                                            onChange={(e) => setSelecciones(prev => ({
                                                ...prev,
                                                [idx]: {
                                                    ...prev[idx],
                                                    cantidad: parseInt(e.target.value) || 1
                                                }
                                            }))}
                                            className="bg-neutral-950 border border-neutral-700 text-white w-14 text-center rounded text-sm focus:border-yellow-500 focus:outline-none disabled:opacity-50"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-0.5 mt-auto pb-1">
                                        <span className="text-xs text-neutral-500 font-medium">Costo: ${Math.round(r.costo).toLocaleString('es-AR')}</span>
                                        <span className="text-[11px] text-green-400 font-bold tracking-widest uppercase opacity-80 decoration-dotted underline decoration-green-500/50">Ganancia: ${Math.round(r.venta - r.costo).toLocaleString('es-AR')}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-[9px] text-yellow-500 font-black uppercase tracking-[0.2em] mb-0.5 opacity-80">Precio Final</span>
                                    <span className="text-2xl font-black text-white font-mono">${Math.round(r.venta).toLocaleString('es-AR')}</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="flex flex-col gap-3 mt-6">
                        <button
                            onClick={generarPDF}
                            disabled={!Object.values(selecciones).some(s => s.seleccionado)}
                            className="flex items-center justify-center gap-2 w-full py-4 bg-red-600 text-white hover:bg-red-700 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed font-black rounded-xl uppercase tracking-widest transition-all shadow-md"
                        >
                            <span>📄 Generar Presupuesto PDF</span>
                        </button>

                        <button onClick={copiarWhatsApp} className="flex items-center justify-center gap-2 w-full py-4 text-yellow-500 border border-yellow-500/50 hover:bg-yellow-400/10 hover:border-yellow-400 font-black rounded-xl uppercase tracking-widest transition-all shadow-sm">
                            <span>💬 Copiar para WhatsApp</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
