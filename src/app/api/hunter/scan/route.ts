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

    const { nicho, ciudad, tono = "Profesional y Amigable", limit = 4 } = await req.json();

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
    
    const searchLimit = Math.min(limit, 10); // Límite máximo 10 para Vercel Serverless
    for (const place of places.slice(0, searchLimit)) { 
      let contenidoWeb = "";
      let emailEncontrado = "";
      
      if (place.website) {
        try {
          const webResp = await fetch(place.website, { signal: AbortSignal.timeout(3000) });
          const html = await webResp.text();
          
          // 1. Extraer Email con Regex
          const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
          const emails = html.match(emailRegex);
          if (emails && emails.length > 0) {
            // Filtrar falsos positivos comunes
            emailEncontrado = emails.find(e => !e.endsWith('.png') && !e.endsWith('.jpg') && !e.includes('sentry')) || "";
          }

          // 2. Extraer Texto Plano
          contenidoWeb = html.replace(/<[^>]*>?/gm, ' ').substring(0, 2000).trim();
        } catch (e) {
          console.warn(`No se pudo scrapear ${place.website}`);
        }
      }

      // MENSAJE DE RESPALDO (Por si la IA falla)
      let propuestaia = `Hola! Cómo estás? 👋 Vi tu negocio *${place.title}* en Google Maps y me pareció excelente. 

Te escribo porque creamos **ITirium**, un CRM diseñado acá en Argentina para ayudar a negocios como el tuyo a organizar sus ventas y clientes de forma fácil.

Te invito a que lo pruebes gratis por 14 días entrando acá: https://itirium-crm.vercel.app 🚀`;

      let score = 5;
      let scoreMotivo = "Lead de búsqueda manual.";
      let esCelular = true;

      if (openaiKey && openaiKey !== 'tu_key_de_openai_aqui') {
        try {
          const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: "gpt-4o-mini", // Modelo rápido
              response_format: { type: "json_object" },
              messages: [{
                role: "system",
                content: `Eres un experto vendedor argentino de ITirium CRM (itirium-crm.vercel.app). 
                Escribe un mensaje corto de WhatsApp para el dueño de un negocio. 
                Adaptá el mensaje a este tono pedido por el usuario: "${tono}".
                USA TONO ARGENTINO (Che, vi tu negocio, probalo, voseo), pero manteniendo la formalidad si se requiere.
                Regla de Reseñas: Si el rating es menor a 4.0, mencioná sutilmente que el CRM los ayuda a dar mejor atención y mejorar la reputación. Si es 4.5 o más, felicitalos por la excelente puntuación.
                Regla de Web: Si no tienen web, mencioná que el CRM les permite tener una presencia digital.
                INCLUYE SIEMPRE el link itirium-crm.vercel.app y menciona los 14 DÍAS GRATIS.
                Analiza el teléfono provisto: en Argentina, si empieza con cód. de área + 15 o si la longitud total con código de área es de 10 dígitos (ej 351xxxxxxx), es celular. Si tiene guiones medios (422-3312) o menos dígitos, suele ser fijo. Devuelve boolean en 'es_celular'.
                Devuelve JSON: {"propuesta": "...", "score": 1-10, "motivo": "...", "es_celular": true|false}`
              }, {
                role: "user",
                content: `Negocio: ${place.title}. Nicho: ${nicho}. Rating: ${place.rating || 'N/A'}. Web: ${place.website || 'No tiene'}. Teléfono: ${place.phoneNumber || 'N/A'}.`
              }]
            })
          });
          
          const aiData = await aiResp.json();
          
          if (aiData.choices && aiData.choices[0]) {
            const parsed = JSON.parse(aiData.choices[0].message.content);
            propuestaia = parsed.propuesta;
            score = parsed.score;
            scoreMotivo = parsed.motivo;
            if (parsed.es_celular !== undefined) esCelular = parsed.es_celular;
          } else {
            console.error("OpenAI Error Detail:", aiData.error || aiData);
          }
        } catch (e) {
          console.error("Error crítico en OpenAI:", e);
        }
      }

      leadsToInsert.push({
        negocio_id: negocio.id,
        nombre: place.title,
        ciudad: ciudad,
        nicho: nicho,
        sitio_web: place.website || '',
        telefono: place.phoneNumber || '',
        email: emailEncontrado,
        metadata: { 
          rating: place.rating, 
          reviews: place.ratingCount,
          vicinity: place.address,
          es_celular: esCelular
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
