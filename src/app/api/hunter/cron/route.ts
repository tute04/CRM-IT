import { createClient } from '@/utils/supabase-server';
import { NextResponse } from 'next/server';

// Este endpoint sería llamado por Vercel Cron o un cron job externo
// Requiere un secreto para evitar que cualquiera lo dispare
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cronSecret = searchParams.get('secret');

  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    
    // 1. Obtener un negocio admin aleatorio para simular el contexto del escaneo
    const { data: negocio } = await supabase
      .from('negocios')
      .select('id, owner_id')
      .eq('plan', 'pro') // O algún filtro para tus admins
      .limit(1)
      .single();

    if (!negocio) throw new Error('No hay negocios pro para el cron');

    // 2. Definir una búsqueda aleatoria (Nichos x Ciudades)
    const nichos = ['Ferreterías', 'Talleres', 'Pinturerías', 'Mueblerías'];
    const ciudades = ['Córdoba', 'Rosario', 'Mendoza', 'Buenos Aires'];
    const nichoAleatorio = nichos[Math.floor(Math.random() * nichos.length)];
    const ciudadAleatoria = ciudades[Math.floor(Math.random() * ciudades.length)];

    console.log(`Cron Hunter: Iniciando búsqueda de ${nichoAleatorio} en ${ciudadAleatoria}`);

    // Llamamos a la lógica interna de escaneo (podríamos refactorizar el código de /scan a una utilidad compartida)
    // Pero por ahora, simulamos la llamada interna
    const hunterResp = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/hunter/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            nicho: nichoAleatorio, 
            ciudad: ciudadAleatoria,
            bypassAuth: true // Necesitaríamos implementar este flag con la cron_secret
        })
    });

    const result = await hunterResp.json();

    return NextResponse.json({ 
      success: true, 
      nicho: nichoAleatorio,
      ciudad: ciudadAleatoria,
      leads_encontrados: result.count 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
