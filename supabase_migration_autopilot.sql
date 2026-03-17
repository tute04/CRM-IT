-- Tabla para las campañas del Piloto Automático
CREATE TABLE IF NOT EXISTS public.campanas_autopilot (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    negocio_id UUID REFERENCES public.negocios(id) ON DELETE CASCADE,
    nombre_campana TEXT NOT NULL,
    nicho TEXT NOT NULL,
    ciudad TEXT NOT NULL,
    limite_diario INTEGER DEFAULT 5,
    activa BOOLEAN DEFAULT false,
    prompt_personalizado TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Políticas de Seguridad (RLS)
ALTER TABLE public.campanas_autopilot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver sus campañas" ON public.campanas_autopilot
    FOR SELECT USING (auth.uid() IN (
        SELECT owner_id FROM public.negocios WHERE id = campanas_autopilot.negocio_id
    ));

CREATE POLICY "Los usuarios pueden crear sus campañas" ON public.campanas_autopilot
    FOR INSERT WITH CHECK (auth.uid() IN (
        SELECT owner_id FROM public.negocios WHERE id = campanas_autopilot.negocio_id
    ));

CREATE POLICY "Los usuarios pueden actualizar sus campañas" ON public.campanas_autopilot
    FOR UPDATE USING (auth.uid() IN (
        SELECT owner_id FROM public.negocios WHERE id = campanas_autopilot.negocio_id
    ));

CREATE POLICY "Los usuarios pueden eliminar sus campañas" ON public.campanas_autopilot
    FOR DELETE USING (auth.uid() IN (
        SELECT owner_id FROM public.negocios WHERE id = campanas_autopilot.negocio_id
    ));

-- Agregar columnas a leads_hunter si no existen
ALTER TABLE public.leads_hunter 
ADD COLUMN IF NOT EXISTS email_enviado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fecha_envio_email TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS campana_id UUID REFERENCES public.campanas_autopilot(id) ON DELETE SET NULL;
