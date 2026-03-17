import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Inicializar Supabase con Service Role (bypassea RLS para que el Cron pueda leer/escribir libremente)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // IMPORTANTE: Necesitamos la Service Role Key para procesos en background
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: Request) {
  // Validación de seguridad para que solo el CRON ejecute esto
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    // 1. Obtener todas las campañas activas
    const { data: campanas, error: campanasErr } = await supabase
      .from('campanas_autopilot')
      .select('*')
      .eq('activa', true);

    if (campanasErr || !campanas || campanas.length === 0) {
      return NextResponse.json({ message: 'No hay campañas activas' });
    }

    const serperKey = process.env.SERPER_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!serperKey || !openaiKey || !process.env.RESEND_API_KEY) {
       return NextResponse.json({ error: 'Faltan API Keys maestras' }, { status: 500 });
    }

    let emailsEnviados = 0;

    // 2. Procesar cada campaña
    for (const campana of campanas) {
      // 2a. Buscar en Serper
      const serperResp = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          q: `${campana.nicho} en ${campana.ciudad}`, 
          type: 'places',
          gl: 'ar' 
        })
      });

      const serperData = await serperResp.json();
      const places = serperData.places || serperData.maps || [];

      // Obtenemos leads de hoy para no procesar los mismos
      const { data: leadsPrevios } = await supabase
        .from('leads_hunter')
        .select('nombre, email');
      
      const prevNames = leadsPrevios?.map(l => l.nombre) || [];

      let leadsProcesadosParaCampana = 0;

      for (const place of places) {
        // Límite diario por campaña
        if (leadsProcesadosParaCampana >= campana.limite_diario) break;

        // Evitar duplicados
        if (prevNames.includes(place.title)) continue;

        let emailEncontrado = "";
        let contenidoWeb = "";

        // 2b. Buscar Email en el sitio web (si existe)
        if (place.website) {
          try {
            const webResp = await fetch(place.website, { signal: AbortSignal.timeout(3000) });
            const html = await webResp.text();
            
            const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
            const emails = html.match(emailRegex);
            if (emails && emails.length > 0) {
              emailEncontrado = emails.find(e => !e.endsWith('.png') && !e.endsWith('.jpg') && !e.includes('sentry')) || "";
            }
            contenidoWeb = html.replace(/<[^>]*>?/gm, ' ').substring(0, 500).trim();
          } catch (e) {
            // Ignorar errores de sitios caídos
          }
        }

        // SOLO SEGUIR SI ENCONTRAMOS EMAIL (El Autopilot necesita emails)
        if (!emailEncontrado) continue;

        // 2c. Generar Email con OpenAI
        let subjectIA = `Mejoras para ${place.title}`;
        let bodyIA = "Hola, vimos tu negocio y nos encantó. Prueba ITirium CRM hoy.";

        try {
          const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              response_format: { type: "json_object" },
              messages: [{
                role: "system",
                content: `Eres un asistente de ventas automático en frío. 
                Debes generar un \`subject\` (asunto) intrigante de 4-6 palabras.
                Y un \`body\` (cuerpo del correo en HTML) profesional, corto y amigable basado en este prompt del usuario: "${campana.prompt_personalizado}".
                Si hay Info Extra de la web úsala para personalizar el primer párrafo.
                Devuelve JSON: { "subject": "...", "body": "..." }`
              }, {
                role: "user",
                content: `Nombre Empresa: ${place.title}. Info Extra de su web: ${contenidoWeb}`
              }]
            })
          });
          
          const aiData = await aiResp.json();
          if (aiData.choices) {
            const parsed = JSON.parse(aiData.choices[0].message.content);
            subjectIA = parsed.subject;
            bodyIA = parsed.body;
          }
        } catch (e) {
             console.error('Error OpenAI Autopilot', e);
        }

        // 2d. Enviar Email vía Resend
        try {
          await resend.emails.send({
            from: 'ITirium CRM <onboarding@resend.dev>', // Por ahora usas resend.dev para pruebas (solo llega a tu correo registrado), cambiar a tu dominio verificado después
            to: emailEncontrado, // NOTA: Hasta que verifiques tu dominio en Resend, esto fallará si envías a correos que no sean el tuyo.
            subject: subjectIA,
            html: bodyIA,
          });

          emailsEnviados++;
          leadsProcesadosParaCampana++;

          // 2e. Guardar en Base de Datos como lead contactado
          await supabase.from('leads_hunter').insert([{
            negocio_id: campana.negocio_id,
            campana_id: campana.id,
            nombre: place.title,
            ciudad: campana.ciudad,
            nicho: campana.nicho,
            email: emailEncontrado,
            sitio_web: place.website || '',
            telefono: place.phoneNumber || '',
            estado: 'contactado', // Ya le enviamos email!
            propuesta_ia: bodyIA.substring(0, 100), // Version resumida o "Enviado por email"
            email_enviado: true,
            fecha_envio_email: new Date().toISOString()
          }]);

        } catch (resendError) {
          console.error("Resend Error al enviar a", emailEncontrado, resendError);
        }
      } 
    }

    return NextResponse.json({ success: true, emails_enviados: emailsEnviados });

  } catch (error: any) {
    console.error('Autopilot Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
