import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // MercadoPago envía diferentes tipos de notificaciones
        // Solo procesamos las de tipo "payment"
        if (body.type !== 'payment' && body.action !== 'payment.created' && body.action !== 'payment.updated') {
            return NextResponse.json({ received: true }, { status: 200 });
        }

        const paymentId = body.data?.id;
        if (!paymentId) {
            console.warn('Webhook sin payment ID:', body);
            return NextResponse.json({ received: true }, { status: 200 });
        }

        // Consultar el pago en MercadoPago
        const mpClient = new MercadoPagoConfig({
            accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
        });

        const paymentApi = new Payment(mpClient);
        const payment = await paymentApi.get({ id: paymentId });

        if (!payment) {
            console.error('Payment not found:', paymentId);
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        console.log(`Webhook: Payment ${paymentId} status: ${payment.status}`);

        // Solo procesar pagos aprobados
        if (payment.status !== 'approved') {
            return NextResponse.json({ received: true, status: payment.status }, { status: 200 });
        }

        // Obtener el negocio_id del external_reference o metadata
        const negocioId = payment.external_reference || (payment.metadata as any)?.negocio_id;

        if (!negocioId) {
            console.error('No negocio_id in payment:', paymentId);
            return NextResponse.json({ error: 'No negocio_id' }, { status: 400 });
        }

        // Actualizar el plan del negocio usando service role (bypasses RLS)
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error: updateError } = await supabaseAdmin
            .from('negocios')
            .update({
                plan: 'activo',
                updated_at: new Date().toISOString(),
            })
            .eq('id', negocioId);

        if (updateError) {
            console.error('Error updating negocio plan:', updateError);
            return NextResponse.json({ error: 'Error updating plan' }, { status: 500 });
        }

        console.log(`✅ Negocio ${negocioId} activado exitosamente (Payment: ${paymentId})`);

        return NextResponse.json({ success: true, negocio_id: negocioId }, { status: 200 });
    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook processing error: ' + (error.message || 'Unknown') },
            { status: 500 }
        );
    }
}

// MercadoPago also sends GET requests to verify the endpoint
export async function GET() {
    return NextResponse.json({ status: 'ok' });
}
