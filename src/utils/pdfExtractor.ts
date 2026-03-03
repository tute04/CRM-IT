export const extractTextFromPDF = async (file: File): Promise<string> => {
    // Importación dinámica para prevenir errores ReferenceError (DOMMatrix) en SSR Next.js
    const pdfjsLib = await import('pdfjs-dist');

    // Configurar el worker de pdf.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + ' ';
    }

    return fullText;
};

export const parseAfipInvoice = (text: string) => {
    // Buscar CUIT del receptor (suele estar después de "CUIT:" en el bloque del cliente)
    // Como el CUIT del emisor también está, buscamos el CUIT que aparece más abajo o usamos un match global y tomamos el segundo.
    const cuitMatches = text.match(/CUIT:\s*(\d{11})/g);
    const cuitCliente = cuitMatches && cuitMatches.length >= 2 ? cuitMatches[1].replace(/\D/g, '') : null;

    // Buscar Importe Total (Ej: "Importe Total: $ 369000,00")
    const totalMatch = text.match(/Importe Total:\s*\$\s*([\d.,]+)/i);
    let total = 0;
    if (totalMatch) {
        // Limpiar formato argentino a float
        total = parseFloat(totalMatch[1].replace(/\./g, '').replace(',', '.'));
    }

    // Buscar Fecha de Emisión (Ej: "Fecha de Emisión: 25/02/2026")
    const fechaMatch = text.match(/Fecha de Emisión:\s*([\d\/]+)/i);
    const fecha = fechaMatch ? fechaMatch[1] : null;

    return { cuitCliente, total, fecha };
};
