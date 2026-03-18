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
    const executionLogs: string[] = [];

    // 2. Procesar cada campaña
    for (const campana of campanas) {
      executionLogs.push(`Iniciando campaña: ${campana.nombre_campana}`);
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
        if (prevNames.includes(place.title)) {
          executionLogs.push(`⚠️ Saltando ${place.title}: Ya existe en base de datos.`);
          continue;
        }

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
            executionLogs.push(`⚠️ Web inalcanzable: ${place.website}`);
          }
        } else {
          executionLogs.push(`❌ ${place.title} no tiene sitio web.`);
        }

        // SOLO SEGUIR SI ENCONTRAMOS EMAIL (El Autopilot necesita emails)
        if (!emailEncontrado) {
          if (place.website && !executionLogs[executionLogs.length - 1].includes("inalcanzable")) {
              executionLogs.push(`❌ No se encontró correo público en la web de ${place.title}.`);
          }
          continue;
        }

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
          // NOTA: Hasta que añadas tu dominio a Resend, solo envía a correos verificados.
          // Para que puedas testearlo y verlo ahora mismo, forzamos a que te llegue una COPIA a tu mail.
          const { data, error } = await resend.emails.send({
            from: 'Piloto Automatico <onboarding@resend.dev>', // No cambiar hasta verificar dominio
            to: ['matebonavia@gmail.com'], // Forzado a tu mail para poder testear la IA. Luego cambiar a: emailEncontrado
            subject: subjectIA,
            html: `
              <div style="background:#fff3ed; padding:15px; border-radius:10px; margin-bottom:20px; border:1px solid #f97316;">
                <p style="color:#f97316; font-weight:bold; margin:0;">🤖 Prueba de ITirium Autopilot</p>
                <p style="margin:5px 0 0 0; font-size:12px; color:#555;">Este mail estaba destinado originalmente a: <strong>${emailEncontrado}</strong> (de ${place.title})</p>
              </div>
              <br/>
              ${bodyIA}
            `,
          });

          if (error) {
             console.error("Resend Error al enviar a", emailEncontrado, error);
             executionLogs.push(`❌ Falló envío por Resend para ${emailEncontrado}: ${error.message}`);
             continue; // Evita contarlo si rebotó
          }

          emailsEnviados++;
          leadsProcesadosParaCampana++;
          executionLogs.push(`✅ Email enviado exitosamente a: ${emailEncontrado}`);

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
            propuesta_ia: bodyIA.substring(0, 500), 
            email_enviado: true,
            fecha_envio_email: new Date().toISOString()
          }]);

        } catch (resendError: any) {
          executionLogs.push(`❌ Excepción de Resend: ${resendError.message}`);
        }
      } 
    }

    return NextResponse.json({ success: true, emails_enviados: emailsEnviados, logs: executionLogs });

  } catch (error: any) {
    console.error('Autopilot Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
