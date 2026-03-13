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

    // 2. PROCESAR LOS PRIMEROS 5 RESULTADOS (Para no quemar créditos rápido)
    const leadsToInsert = [];
    
    for (const place of places.slice(0, 5)) {
      // Generar propuesta con IA para cada uno
      let propuesta = `Hola! Vi tu negocio ${place.title} en Google Maps y me pareció excelente. Quería comentarte que estamos ayudando a negocios de ${ciudad} a automatizar su gestión con ITrium...`;

      if (openaiKey && openaiKey !== 'tu_key_de_openai_aqui') {
        try {
          const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [{
                role: "system",
                content: "Eres un experto en ventas de ITrium, un CRM para negocios argentinos. Tu tarea es escribir un mensaje de WhatsApp corto, amigable y muy convincente para un dueño de negocio. No uses un lenguaje muy formal."
              }, {
                role: "user",
                content: `Escribe un pitch de venta para: ${place.title}. Es una ${nicho} en ${ciudad}. Tiene ${place.rating} estrellas en Google. ${place.website ? 'Tienen web' : 'NO tienen web'}. Enfócate en cómo ITrium les ahorra tiempo.`
              }]
            })
          });
          const aiData = await aiResp.json();
          propuesta = aiData.choices[0].message.content;
        } catch (e) {
          console.error("Error generando propuesta con OpenAI", e);
        }
      }

      leadsToInsert.push({
        negocio_id: negocio.id,
        nombre: place.title,
        ciudad: ciudad,
        nicho: nicho,
        sitio_web: place.website || '',
        telefono: place.phoneNumber || '',
        metadata: { rating: place.rating, reviews: place.ratingCount },
        estado: 'nuevo',
        propuesta_ia: propuesta
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
