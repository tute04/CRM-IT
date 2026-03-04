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

        // 1. Limpiamos saltos de línea y normalizamos
        const cleanText = text.replace(/\r\n/g, '\n');

        // 2. EXTRACCIÓN DEL CLIENTE (A prueba de columnas mezcladas)
        let clienteExtraido = "Cliente Desconocido";
        const razonSocialMatch = cleanText.match(/Apellido y Nombre \/ Razón Social:\s*(.+)/i);

        if (razonSocialMatch) {
            let tempName = razonSocialMatch[1];
            // Borramos encabezados intrusos que pdf2json suele leer por error de columnas
            const headersBorrables = [/Domicilio Comercial:/ig, /Condición frente al IVA:/ig, /IVA Responsable Inscripto/ig, /Cuenta Corriente/ig, /CUIT:/ig];
            headersBorrables.forEach(regex => { tempName = tempName.replace(regex, ''); });

            // Agarramos lo que quedó limpio hasta el primer salto de línea o espacio gigante
            clienteExtraido = tempName.trim().split(/\s{2,}|\n/)[0].trim();
        }

        // 3. EXTRACCIÓN DE PRODUCTOS / DETALLE
        let detalleExtraido = "Venta";
        // Buscamos lo que está debajo de la columna "Subtotal c/IVA" y antes de los "Tributos" o "Importe Neto"
        const tablaMatch = cleanText.match(/Subtotal c\/IVA\s*\n([\s\S]*?)(?:Importe Otros Tributos|Importe Neto Gravado)/i);

        if (tablaMatch && tablaMatch[1]) {
            // Filtramos para quedarnos con el texto que parece la descripción de la goma/servicio
            const lineasProducto = tablaMatch[1]
                .split('\n')
                .map(l => l.trim())
                .filter(l => l.length > 5) // ignorar números sueltos
                .filter(l => !l.includes('unidades') && !l.match(/^[0-9,\.]+$/)); // sacar columnas de cantidades y precios

            if (lineasProducto.length > 0) {
                detalleExtraido = lineasProducto.join(' + ').substring(0, 120); // Unimos y limitamos largo
            }
        }

        // 4. EXTRACCIÓN DEL MONTO (Ya funcionaba perfecto)
        const matchMonto = cleanText.match(/Importe Total:(?:\s*\n*\s*)\$?\s*([\d,\.]+)/);
        let montoExtraido = 0;
        if (matchMonto) {
            montoExtraido = parseFloat(matchMonto[1].replace(/\./g, '').replace(',', '.'));
        }

        return NextResponse.json({
            nombre_cliente: clienteExtraido,
            telefono: "", // Sigue vacío para que no inyecte el de Chrome
            detalle: detalleExtraido,
            monto: montoExtraido,
            fecha: new Date().toISOString().split('T')[0]
        });

    } catch (error) {
        console.error("Error fatal extrayendo PDF con pdf2json:", error);
        return NextResponse.json({ error: 'Error interno leyendo PDF' }, { status: 500 });
    }
}
