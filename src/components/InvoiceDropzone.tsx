'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface Props {
    onExtracted: (data: any) => void;
    clientes?: any[];
}

export default function InvoiceDropzone({ onExtracted, clientes = [] }: Props) {
    const [isProcessing, setIsProcessing] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsProcessing(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/extract-invoice', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error("Error en extracción");

            const extractedData = await res.json();

            onExtracted({
                nombre_cliente: extractedData.nombre_cliente || '',
                telefono: extractedData.telefono || '',
                monto: extractedData.monto || 0,
                detalle: extractedData.detalle || (extractedData.fecha ? `Venta de Fecha ${extractedData.fecha}` : 'Venta Registrada (Remito)'),
                vendedor: extractedData.vendedor || '',
            });
        } catch (err) {
            console.error(err);
            alert("Error al procesar la factura.");
        } finally {
            setIsProcessing(false);
        }
    }, [onExtracted, clientes]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': [],
            'application/pdf': []
        },
        maxFiles: 1,
        disabled: isProcessing
    });

    return (
        <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${isDragActive
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/5'
                : 'border-zinc-300 dark:border-zinc-700 hover:border-orange-400 dark:hover:border-orange-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                } ${isProcessing ? 'pointer-events-none opacity-80' : ''}`}
        >
            <input {...getInputProps()} />
            {isProcessing ? (
                <div className="flex flex-col items-center justify-center gap-4 py-10">
                    <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-orange-500 font-semibold text-base">Analizando factura...</p>
                </div>
            ) : (
                <div className="py-10">
                    <div className="w-12 h-12 mx-auto mb-4 bg-orange-50 dark:bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                    </div>
                    <p className="text-zinc-900 dark:text-white font-medium text-base">Arrastrá la factura acá</p>
                    <p className="text-zinc-400 text-sm mt-2">PDF o imagen · O hacé clic para buscar</p>
                </div>
            )}
        </div>
    );
}
