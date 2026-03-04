import { NextResponse } from 'next/server';
// @ts-ignore - Ignoramos los tipos si no están instalados para evitar fallos de build
import PDFParser from 'pdf2json';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Envolvemos el parser basado en eventos en una Promesa moderna
        const text = await new Promise<string>((resolve, reject) => {
            const pdfParser = new PDFParser(null, true);

            pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
            pdfParser.on("pdfParser_dataReady", () => {
                resolve(pdfParser.getRawTextContent());
            });

            pdfParser.parseBuffer(buffer);
        });

        // --- Extracción a prueba de balas para el Cliente ---
        let clienteExtraido = "Cliente Desconocido";

        // 1. Partimos el texto justo donde empieza el nombre
        const partesCliente = text.split(/Apellido y Nombre \/ Razón Social:\s*/i);

        if (partesCliente.length > 1) {
            // 2. Agarramos todo lo que sigue después de "Razón Social:"
            let textoSobrante = partesCliente[1];

            // 3. Lo cortamos en seco apenas aparezca "Domicilio", "Condición" o "CUIT" (limpiando la basura)
            clienteExtraido = textoSobrante.split(/Domicilio|Condición|CUIT/i)[0].trim();

            // Por si quedó algún salto de línea pegado
            clienteExtraido = clienteExtraido.split('\n')[0].trim();
        }

        // 3. Extracción de Monto Total (Esto ya funciona bien, déjalo igual)
        const matchMonto = text.match(/Importe Total:(?:\s*\n*\s*|\r\n)\$?\s*([\d,\.]+)/);
        let montoExtraido = 0;

        if (matchMonto) {
            const numeroLimpio = matchMonto[1].replace(/\./g, '').replace(',', '.');
            montoExtraido = parseFloat(numeroLimpio);
        }

        return NextResponse.json({
            nombre_cliente: clienteExtraido,
            telefono: "",
            detalle: "Extracción automática PDF AFIP",
            monto: montoExtraido,
            fecha: new Date().toISOString().split('T')[0]
        });

    } catch (error) {
        console.error("Error fatal extrayendo PDF con pdf2json:", error);
        return NextResponse.json({ error: 'Error interno leyendo PDF' }, { status: 500 });
    }
}
