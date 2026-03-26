'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, FileUp, Zap } from 'lucide-react';

interface Props {
    onExtracted: (data: any) => void;
    clientes?: any[];
}

export default function InvoiceDropzone({ onExtracted, clientes = [] }: Props) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'error' | 'success'>('idle');
    const [errorMessage, setErrorMessage] = useState("");

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsProcessing(true);
        setStatus('uploading');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/extract-invoice', {
                method: 'POST',
                body: formData
            });

            const responseData = await res.json();
            if (!res.ok) throw new Error(responseData.error || "Error en extracción");

            const extractedData = responseData;

            setStatus('success');
            
            // Un pequeño delay para que el usuario vea el estado de éxito antes de cerrar
            setTimeout(() => {
                onExtracted({
                    nombre_cliente: extractedData.nombre_cliente || '',
                    telefono: extractedData.telefono || '',
                    monto: extractedData.monto || 0,
                    detalle: extractedData.detalle || (extractedData.fecha ? `Venta de Fecha ${extractedData.fecha}` : 'Venta Registrada (Remito)'),
                    vendedor: extractedData.vendedor || '',
                    fecha: extractedData.fecha || new Date().toISOString().split('T')[0]
                });
            }, 600);

        } catch (err: any) {
            console.error(err);
            setErrorMessage(err.message || "Asegúrate de que sea un PDF o imagen clara");
            setStatus('error');
            setTimeout(() => { setStatus('idle'); setErrorMessage(""); }, 5000);
        } finally {
            setIsProcessing(false);
        }
    }, [onExtracted]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': []
        },
        maxFiles: 1,
        disabled: isProcessing
    });

    return (
        <div
            {...getRootProps()}
            className={`relative overflow-hidden group border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[300px] ${
                isDragActive
                    ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-500/10 scale-[1.02] shadow-xl shadow-orange-500/10'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-orange-400 dark:hover:border-orange-500/30 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
            } ${isProcessing ? 'pointer-events-none' : ''}`}
        >
            <input {...getInputProps()} />

            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#f97316 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
            
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-zinc-300 dark:border-zinc-700 rounded-tl group-hover:border-orange-500/50 transition-colors" />
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-zinc-300 dark:border-zinc-700 rounded-tr group-hover:border-orange-500/50 transition-colors" />
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-zinc-300 dark:border-zinc-700 rounded-bl group-hover:border-orange-500/50 transition-colors" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-zinc-300 dark:border-zinc-700 rounded-br group-hover:border-orange-500/50 transition-colors" />

            {status === 'uploading' ? (
                <div className="flex flex-col items-center justify-center gap-5 relative z-10 animate-fade-in">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-orange-500 animate-pulse" />
                        </div>
                    </div>
                    <div>
                        <p className="text-zinc-900 dark:text-white font-bold text-lg">Procesando archivo...</p>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Extrayendo datos de la factura</p>
                    </div>
                </div>
            ) : status === 'success' ? (
                <div className="flex flex-col items-center justify-center gap-4 relative z-10 animate-scale-in">
                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <p className="text-zinc-900 dark:text-white font-bold text-lg">¡Factura Extraída!</p>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Cargando formulario...</p>
                </div>
            ) : status === 'error' ? (
                <div className="flex flex-col items-center justify-center gap-4 relative z-10 animate-fade-in">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <p className="text-zinc-900 dark:text-white font-bold text-lg">Error al procesar</p>
                    <p className="text-red-500/80 text-sm max-w-[80%]">{errorMessage || 'Asegúrate de subir un PDF válido'}</p>
                    <button className="mt-2 text-sm font-medium text-orange-500 hover:underline">Intentar de nuevo</button>
                </div>
            ) : (
                <div className="relative z-10 flex flex-col items-center transition-all duration-300 group-hover:translate-y-[-4px]">
                    <div className={`w-20 h-20 mb-6 rounded-3xl flex items-center justify-center transition-all duration-500 ${
                        isDragActive 
                        ? 'bg-orange-500 text-white rotate-12 scale-110 shadow-2xl shadow-orange-500/40' 
                        : 'bg-zinc-100 dark:bg-white/5 text-zinc-400 group-hover:bg-orange-50 dark:group-hover:bg-orange-500/10 group-hover:text-orange-500 group-hover:rotate-[-4deg]'
                    }`}>
                        {isDragActive ? <FileUp className="w-10 h-10" /> : <Upload className="w-10 h-10" />}
                    </div>
                    
                    <div className="space-y-2">
                        <h4 className="text-zinc-900 dark:text-white font-bold text-xl tracking-tight">
                            {isDragActive ? 'Soltá para extraer' : 'Subí tu factura PDF'}
                        </h4>
                        <p className="text-zinc-500 dark:text-zinc-400 text-base max-w-[280px] mx-auto leading-relaxed">
                            Arrastrá el archivo <span className="text-orange-500 font-semibold italic">formato PDF</span> para precargar la venta.
                        </p>
                    </div>

                    <div className="mt-8 flex items-center justify-center w-full">
                        <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 px-3 py-1.5 rounded-full">
                            <FileText className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Solo PDFs</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

