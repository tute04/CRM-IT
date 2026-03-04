import { NextResponse } from 'next/server';
// @ts-ignore
import PDFParser from 'pdf2json';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

        const buffer = Buffer.from(await file.arrayBuffer());

        const text = await new Promise<string>((resolve, reject) => {
            const pdfParser = new PDFParser(null, true);
            pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
            pdfParser.on("pdfParser_dataReady", () => resolve(pdfParser.getRawTextContent()));
            pdfParser.parseBuffer(buffer);
        });

        const cleanText = text.replace(/\r/g, '');

        // Aplanar el texto porque pdf2json mezcla columnas y rompe renglones
        const textoPlano = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');

        // ============================================================
        // 1. CLIENTE
        // ============================================================
        // pdf2json mezcla las columnas de la AFIP así:
        // "...Apellido y Nombre / Razón Social: Domicilio Comercial: 30/10/2025 23236319679 30715980742 ROLEN S.A Avenida Santa Ana..."
        // El nombre del cliente NO viene justo después de "Social:", sino DESPUÉS del último CUIT (11 dígitos)
        let clienteExtraido = "Cliente Desconocido";

        const afterApellido = textoPlano.split(/Apellido y Nombre/i)[1] || '';
        const seccionCliente = afterApellido.split(/Cuenta Corriente|Punto de Venta|C[óo]digo|Producto/i)[0] || '';

        // Encontrar el último CUIT (10-11 dígitos) en la sección del cliente
        const cuitMatches = [...seccionCliente.matchAll(/\b(\d{10,11})\b/g)];
        if (cuitMatches.length > 0) {
            const lastMatch = cuitMatches[cuitMatches.length - 1];
            const idx = lastMatch.index ?? 0;
            const afterCuit = seccionCliente.substring(idx + lastMatch[0].length).trim();

            // El nombre del cliente va desde después del CUIT hasta el inicio de la dirección
            const addressRegex = /\b(Avenida|Av\.|Av\b|Avda|Boulevard|Bv\.|Bv\b|Blvd|Calle|Cerro|Barrio|B[°º]|Pasaje|Pje|Ruta|Camino|Autopista|Diagonal|Plaza)\b/i;
            const nameEnd = afterCuit.search(addressRegex);
            if (nameEnd > 0) {
                clienteExtraido = afterCuit.substring(0, nameEnd).trim();
            } else if (afterCuit.length > 0) {
                clienteExtraido = afterCuit.substring(0, 50).trim();
            }
        }

        // ============================================================
        // 2. VENDEDOR
        // ============================================================
        // En el texto aplanado, el vendedor aparece como:
        // "...Domicilio Comercial: Razón Social: BONAVIA HILARIO MARCELO Condición frente al IVA:..."
        let vendedorExtraido = "";
        const vendorMatch = textoPlano.match(/Domicilio Comercial:\s*Raz[óo]n Social:\s*(.+?)(?:\s+Condici|\s+IVA|\s+FACTURA)/i);
        if (vendorMatch) {
            vendedorExtraido = vendorMatch[1].replace(/^[^a-zA-Z0-9]+/, '').replace(/[-:]+$/, '').trim();
        }

        // ============================================================
        // 3. PRODUCTOS
        // ============================================================
        let detalleExtraido = "";
        const matchTabla = cleanText.match(/Subtotal c\/IVA([\s\S]*?)(?:Importe Otros|Importe Neto|CAE N|Subtotal)/i);
        if (matchTabla) {
            let lineas = matchTabla[1].split('\n').map(l => l.trim()).filter(l => l.length > 2);
            let productosFiltrados: string[] = [];

            for (let l of lineas) {
                if (/^[\d.,\s%$-]+$/.test(l)) continue;
                if (l.toLowerCase().includes('cae ') || l.toLowerCase().includes('comprobante') || l.toLowerCase().includes('pág') || l.toLowerCase().includes('importe') || l.toLowerCase().includes('fecha de vto')) continue;

                let prodName = l.replace(/\s+\d+[,.]\d+\s+(unidades|u\.|kg|lts|mts|cm|gr).*/i, '');
                prodName = prodName.replace(/\s+\d+[,.]\d+\s*%.*/, '');

                if (prodName.length > 3) {
                    productosFiltrados.push(prodName.trim());
                }
            }
            detalleExtraido = productosFiltrados.join(' + ').substring(0, 150);
        }

        // ============================================================
        // 4. MONTO
        // ============================================================
        let montoExtraido = 0;
        const matchMonto = cleanText.match(/Importe Total:(?:\s*\n*\s*)\$?\s*([\d,\.]+)/i);
        if (matchMonto) {
            montoExtraido = parseFloat(matchMonto[1].replace(/\./g, '').replace(',', '.'));
        }

        return NextResponse.json({
            nombre_cliente: clienteExtraido || "Cliente Desconocido",
            telefono: "",
            detalle: detalleExtraido || "Venta de productos",
            monto: montoExtraido || 0,
            vendedor: vendedorExtraido,
            fecha: new Date().toISOString().split('T')[0]
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Error leyendo PDF' }, { status: 500 });
    }
}
