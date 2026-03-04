import { NextResponse } from 'next/server';

// Requires para compatibilidad con commonjs y next.js
const pdfParse = require('pdf-parse');

export async function POST(req: Request) {
    try {
        const data = await req.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
        }

        if (file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'El archivo debe ser un PDF' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const pdfData = await pdfParse(buffer);
        const text = pdfData.text;

        // --- Extracción con Regex ---

        // 1. Cliente: Apellido y Nombre / Razón Social: 
        const clienteMatch = text.match(/Apellido y Nombre \/ Razón Social:\s*(.+)/);
        const nombre_cliente = clienteMatch ? clienteMatch[1].trim() : '';

        // 2. Fecha: Fecha de Emisión: DD/MM/YYYY -> Formato para input type="date" YYYY-MM-DD
        const fechaMatch = text.match(/Fecha de Emisión:\s*(\d{2}\/\d{2}\/\d{4})/);
        let fechaFormatada = '';
        if (fechaMatch) {
            const [dia, mes, anio] = fechaMatch[1].split('/');
            fechaFormatada = `${anio}-${mes}-${dia}`;
        }

        // 3. Monto Total: Importe Total: $ 123.456,78
        const montoMatch = text.match(/Importe Total:(?:\s*\n*\s*)\$?\s*([\d,\.]+)/);
        let monto = 0;
        if (montoMatch) {
            monto = parseFloat(montoMatch[1].replace(/\./g, '').replace(',', '.'));
        }

        return NextResponse.json({
            nombre_cliente,
            telefono: "",
            detalle: "Extracción automática PDF AFIP",
            monto,
            fecha: fechaFormatada
        });

    } catch (error) {
        console.error("Error al procesar el PDF:", error);
        return NextResponse.json({ error: 'No se pudo leer el PDF' }, { status: 500 });
    }
}
