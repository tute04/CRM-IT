import { createClient } from '@/utils/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.email !== 'matebonavia@gmail.com') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { leadId } = await req.json();

    // 1. Obtener los datos del lead
    const { data: lead, error: fetchError } = await supabase
      .from('leads_hunter')
      .select('*')
      .eq('id', leadId)
      .single();

    if (fetchError || !lead) throw new Error('Lead no encontrado');

    // 2. Insertarlo en la tabla de clientes reales
    const { data: cliente, error: insertError } = await supabase
      .from('clientes')
      .insert({
        negocio_id: lead.negocio_id,
        nombre: lead.nombre,
        email: lead.email || '',
        telefono: lead.telefono,
        ciudad: lead.ciudad,
        notas: `Convertido desde Lead Hunter AI. Rubro: ${lead.nicho}. Scoring: ${lead.scoring}/10. Motivo: ${lead.scoring_motivo}`
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 3. Marcar el lead como convertido
    await supabase
      .from('leads_hunter')
      .update({ 
        estado: 'interesado',
        convertido_cliente_id: cliente.id 
      })
      .eq('id', leadId);

    return NextResponse.json({ success: true, clienteId: cliente.id });

  } catch (error: any) {
    console.error('Convert Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
