import { createClient } from '@/utils/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Seguridad: Solo el administrador puede usar el Hunter
    if (!user || user.email !== 'matebonavia@gmail.com') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { nicho, ciudad } = await req.json();

    const serperKey = process.env.SERPER_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!serperKey || serperKey === 'tu_key_de_serper_aqui') {
      return NextResponse.json({ 
        error: 'Falta la API Key de Serper. Por favor, configúrala en el archivo .env.local para buscar leads reales.' 
      }, { status: 400 });
    }

    // Obtener el ID del negocio del admin
    const { data: negocio } = await supabase
      .from('negocios')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!negocio) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    // 1. BUSCAR EN GOOGLE MAPS USANDO SERPER (Endpoint de búsqueda general con tipo places)
    const serperResp = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        q: `${nicho} en ${ciudad}`, 
        type: 'places',
        gl: 'ar' 
      })
    });

    const serperData = await serperResp.json();
    const places = serperData.places || serperData.maps || [];

    // 2. PROCESAR RESULTADOS CON IA AVANZADA
    const leadsToInsert = [];
    
    for (const place of places.slice(0, 4)) { // 4 por vez para balancear velocidad
      let contenidoWeb = "";
      
      // Módulo "Ojo Mágico": Scraping básico si tiene web
      if (place.website) {
        try {
          const webResp = await fetch(place.website, { signal: AbortSignal.timeout(3000) });
          const html = await webResp.text();
          // Extraemos solo texto plano básico (primeros 2000 caracteres)
          contenidoWeb = html.replace(/<[^>]*>?/gm, ' ').substring(0, 2000).trim();
        } catch (e) {
          console.warn(`No se pudo scrapear ${place.website}`);
        }
      }

      let propuestaia = `Hola! Vi tu negocio ${place.title}. Soy de ITrium y quería ayudarte...`;
      let score = 5;
      let scoreMotivo = "Lead estándar de búsqueda.";

      if (openaiKey && openaiKey !== 'tu_key_de_openai_aqui') {
        try {
          const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo-0125",
              response_format: { type: "json_object" },
              messages: [{
                role: "system",
                content: `Eres un consultor de ventas experto para ITrium CRM. 
                Debes analizar los datos de un negocio y devolver un JSON con:
                {
                  "propuesta": "mensaje de whatsapp hiper-personalizado",
                  "score": número del 1 al 10,
                  "motivo": "breve explicación del score"
                }
                Si el negocio NO tiene web, el score sube (+2). Si tiene mala puntuación, el score sube (+1) porque necesitan gestión.`
              }, {
                role: "user",
                content: `Negocio: ${place.title}. Nicho: ${nicho}. Rating: ${place.rating}. Web: ${place.website || 'No tiene'}. 
                Contenido extraído web (si hay): ${contenidoWeb.substring(0, 500)}`
              }]
            })
          });
          const aiData = await aiResp.json();
          const parsed = JSON.parse(aiData.choices[0].message.content);
          propuestaia = parsed.propuesta;
          score = parsed.score;
          scoreMotivo = parsed.motivo;
        } catch (e) {
          console.error("Error en el cerebro de IA:", e);
        }
      }

      leadsToInsert.push({
        negocio_id: negocio.id,
        nombre: place.title,
        ciudad: ciudad,
        nicho: nicho,
        sitio_web: place.website || '',
        telefono: place.phoneNumber || '',
        metadata: { 
          rating: place.rating, 
          reviews: place.ratingCount,
          vicinity: place.address 
        },
        estado: 'nuevo',
        propuesta_ia: propuestaia,
        scoring: score,
        scoring_motivo: scoreMotivo,
        contenido_web: contenidoWeb.substring(0, 1000)
      });
    }

    if (leadsToInsert.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "No se encontraron resultados reales." });
    }

    const { data, error } = await supabase
      .from('leads_hunter')
      .insert(leadsToInsert)
      .select();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      count: data.length,
      leads: data 
    });

  } catch (error: any) {
    console.error('Hunter Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
