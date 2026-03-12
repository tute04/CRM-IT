import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { negocio_id } = body;

        if (!negocio_id) {
            return NextResponse.json({ error: 'negocio_id requerido' }, { status: 400 });
        }

        // Verificar que el negocio existe usando service role
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: negocio, error: negocioError } = await supabaseAdmin
            .from('negocios')
            .select('id, nombre, owner_id')
            .eq('id', negocio_id)
            .single();

        if (negocioError || !negocio) {
            return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
        }

        // Configurar MercadoPago
        const mpClient = new MercadoPagoConfig({
            accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
        });

        const preference = new Preference(mpClient);

        const precioMensual = parseFloat(process.env.PRECIO_MENSUAL_ARS || '8990'); // API fallback
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

        const result = await preference.create({
            body: {
                items: [
                    {
                        id: `crm-pro-${negocio_id}`,
                        title: `CRM Pro - Suscripción Mensual (${negocio.nombre})`,
                        quantity: 1,
                        unit_price: precioMensual,
                        currency_id: 'ARS',
                    },
                ],
                back_urls: {
                    success: `${appUrl}/suscripcion?status=success`,
                    failure: `${appUrl}/suscripcion?status=failure`,
                    pending: `${appUrl}/suscripcion?status=pending`,
                },
                auto_return: 'approved',
                external_reference: negocio_id, // Para identificar el negocio en el webhook
                notification_url: `${appUrl}/api/pagos/webhook`,
                metadata: {
                    negocio_id: negocio_id,
                    owner_id: negocio.owner_id,
                },
            },
        });

        return NextResponse.json({
            init_point: result.init_point,
            id: result.id,
        });
    } catch (error: any) {
        console.error('Error creating MercadoPago preference:', error);
        return NextResponse.json(
            { error: 'Error al crear el pago: ' + (error.message || 'Error interno') },
            { status: 500 }
        );
    }
}
