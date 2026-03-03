import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No se envió ningún archivo.' }, { status: 400 });
        }

        // =========================================================================
        // ⚠️ ATENCIÓN DESARROLLADOR: CONECTAR AQUÍ API DE VISION / OCR ⚠️
        // =========================================================================
        // Actualmente esto es un MOCK (Simulación) para UX. 
        // 
        // Pasos para implementar en Producción:
        // 1. Obtener la API Key de OpenAI (o AWS Textract / Google Cloud Vision).
        // 2. Convertir el 'file' (File o Blob) a un Buffer o Base64.
        // 3. Enviar este Base64 al modelo gpt-4o de OpenAI pasándole un prompt como:
        //    "Extrae de esta factura: nombre del cliente, teléfono, detalle de los ítems, monto total."
        // 4. Parsear el resultado en JSON estructurado.
        // =========================================================================

        // Simulamos un retraso de procesamiento para testear UX
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Respuesta simulada (MOCK)
        const extractedData = {
            nombre_cliente: "Transportes Ejemplo",
            telefono: "1155667788",
            detalle: "Extracción automática de factura",
            monto: 150000,
            fecha: "2026-03-03",
            vendedor: "Sistema"
        };

        return NextResponse.json(extractedData);

    } catch (error: any) {
        console.error("Error en extracción:", error);
        return NextResponse.json({ error: error.message || 'Error interno al procesar factura.' }, { status: 500 });
    }
}
