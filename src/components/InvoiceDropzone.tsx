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
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-300 flex flex-col items-center justify-center ${isDragActive
                ? 'border-yellow-400 bg-neutral-800'
                : 'border-neutral-700 hover:border-yellow-400 hover:bg-neutral-800/50'
                } ${isProcessing ? 'pointer-events-none opacity-80' : ''}`}
        >
            <input {...getInputProps()} />
            {isProcessing ? (
                <div className="flex flex-col items-center justify-center gap-4 py-10">
                    <svg className="animate-spin h-12 w-12 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-yellow-400 font-bold text-xl animate-pulse tracking-wide">🪄 Analizando factura...</p>
                </div>
            ) : (
                <div className="py-10">
                    <div className="text-5xl mb-6">📥</div>
                    <p className="text-white font-bold text-xl tracking-wide">Arrastrá la factura acá (PDF o Imagen)</p>
                    <p className="text-neutral-500 font-medium mt-3 text-sm uppercase tracking-widest">O hacé clic para buscar en tu PC</p>
                </div>
            )}
        </div>
    );
}
