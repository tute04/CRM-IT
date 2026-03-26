const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const { createCanvas } = require('@napi-rs/canvas');

async function testPdf() {
    try {
        console.log('Testing PDF to Image...');
        // Create a dummy simple PDF buffer or just use a local one if they have it
        const pdfFiles = fs.readdirSync('.').filter(f => f.endsWith('.pdf'));
        if (pdfFiles.length === 0) {
            console.log('No PDF isolated for testing, skipping...');
            return;
        }
        
        const data = new Uint8Array(fs.readFileSync(pdfFiles[0]));
        const loadingTask = pdfjsLib.getDocument({ data });
        const pdf = await loadingTask.promise;
        console.log('Loaded PDF, pages:', pdf.numPages);
        
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = createCanvas(viewport.width, viewport.height);
        const ctx = canvas.getContext('2d');
        
        await page.render({ canvasContext: ctx, viewport }).promise;
        const b64 = canvas.toDataURL('image/jpeg');
        console.log('Success!', b64.substring(0, 50));
    } catch (err) {
        console.error('Error during test:', err);
    }
}

testPdf();
