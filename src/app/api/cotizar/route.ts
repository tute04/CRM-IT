import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const MARCAS_VIP = ["dunlop", "fate", "corven"];
const DESCUENTO_VIP = 0.05;
const DESCUENTO_GENERAL = 0.10;
const MARGEN_GANANCIA = 1.25;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const medida = searchParams.get('medida');

    if (!medida) {
        return NextResponse.json({ error: 'Falta la medida' }, { status: 400 });
    }

    try {
        const url = `https://www.gomeriacentral.com/search/?q=${encodeURIComponent(medida)}`;

        const res = await fetch(url, {
            cache: 'no-store',
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const html = await res.text();
        const $ = cheerio.load(html);

        // 1. Extraer tokens numéricos de la medida
        const tokensNumericos = medida.match(/\d+/g) || [];

        const validLinks: string[] = [];

        // 2. Iterar sobre todos los links de producto o neumático
        $('a[href*="/productos/"], a[href*="/neumaticos/"]').each((_, el) => {
            if (validLinks.length >= 5) return false; // stop map execution if we have 5

            const text = $(el).text().toLowerCase();
            const href = $(el).attr('href');

            if (!href) return true; // continue

            // 3. Criterio de match estricto: ¿Aparecen todos los números en el texto del link?
            let hasAllTokens = true;
            for (const token of tokensNumericos) {
                if (!text.includes(token)) {
                    hasAllTokens = false;
                    break;
                }
            }

            if (!hasAllTokens) return true; // ignore if it doesn't match the strict parameters

            const cleanHref = href.split('?')[0].split('#')[0];
            if (!validLinks.find(link => link === cleanHref)) {
                validLinks.push(cleanHref);
            }
        });

        // 4. Scraping Interno por URl
        const results = await Promise.all(validLinks.map(async (link) => {
            const fullUrl = link.startsWith('http') ? link : `https://www.gomeriacentral.com${link}`;
            try {
                const pageRes = await fetch(fullUrl, {
                    cache: 'no-store',
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                });
                const pageHtml = await pageRes.text();
                const $page = cheerio.load(pageHtml);

                const titulo = $page('h1').first().text().trim();

                // 5. Ubicar el contenedor principal de producto (Fallback en main)
                const contenedor = $page('.js-product-container').length
                    ? $page('.js-product-container')
                    : $page('#product-container').length
                        ? $page('#product-container')
                        : $page('main');

                const textoProducto = contenedor.text().replace(/\s+/g, ' ');

                // 6. Regex match del precio
                const priceMatch = textoProducto.match(/(\$\s?[\d\.]+,\d{2})\s+con\s+Transferencia/i);
                if (!priceMatch) return null;

                // Limpiar string a Float quitando los puntos y usando la coma decimal (,) o eliminando simbolos extra
                const cleanPrice = priceMatch[1]
                    .replace(/\$/g, '')
                    .replace(/\./g, '')
                    .replace(/,/g, '.')
                    .trim();

                const precioRaw = parseFloat(cleanPrice);
                if (isNaN(precioRaw)) return null;

                // Aplicar logica
                const isVip = MARCAS_VIP.some(marca => titulo.toLowerCase().includes(marca));
                const costo = precioRaw * (1 - (isVip ? DESCUENTO_VIP : DESCUENTO_GENERAL));
                const venta = costo * MARGEN_GANANCIA;

                // --- LÓGICA DE DETECCIÓN DE STOCK CLONADA DE PYTHON ---
                let stock = -1; // Por defecto: No sabemos
                const textoLower = textoProducto.toLowerCase();

                // 1. Buscamos stock POSITIVO primero
                const patronesStock = [
                    /quedan\s+(\d+)\s+en\s+stock/,
                    /stock:\s*(\d+)/,
                    /(\d+)\s+unidades?\s+disponibles?/,
                    /disponibles?:\s*(\d+)/
                ];

                let stockEncontrado = false;
                for (const patron of patronesStock) {
                    const matchStock = textoLower.match(patron);
                    if (matchStock && matchStock[1]) {
                        stock = parseInt(matchStock[1], 10);
                        stockEncontrado = true;
                        break; // Si encontramos, dejamos de buscar
                    }
                }

                // 2. Si no encontramos número, buscamos señales de AGOTADO
                if (!stockEncontrado) {
                    const patronesAgotado = [
                        /\bagotado\b/,
                        /\bsin\s+stock\b/,
                        /\bno\s+(?:hay|tiene|disponible|queda)\s+stock\b/,
                        /\bno\s+disponible\b/,
                        /\bstock:\s*0\b/
                    ];

                    for (const patron of patronesAgotado) {
                        if (patron.test(textoLower)) {
                            stock = 0;
                            break;
                        }
                    }
                }
                // ------------------------------------------------------

                return { titulo, costo, venta, stock, link: fullUrl };
            } catch (error) {
                console.error("Error fetching " + fullUrl, error);
                return null;
            }
        }));

        const finalResults = results
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .sort((a, b) => a.venta - b.venta);

        return NextResponse.json(finalResults);
    } catch (e: any) {
        console.error("Scraping error:", e);
        return NextResponse.json({ error: 'Error interno del cotizador' }, { status: 500 });
    }
}
