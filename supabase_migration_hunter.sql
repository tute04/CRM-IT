-- ============================================================
-- ITrium Lead Hunter - Módulo de Prospección Autónoma
-- ============================================================

CREATE TABLE IF NOT EXISTS public.leads_hunter (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  negocio_id UUID REFERENCES public.negocios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  sitio_web TEXT,
  ciudad TEXT,
  nicho TEXT,
  estado TEXT DEFAULT 'nuevo' CHECK (estado IN ('nuevo', 'contactado', 'interesado', 'rechazado')),
  propuesta_ia TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS para leads_hunter
ALTER TABLE public.leads_hunter ENABLE ROW LEVEL SECURITY;

-- Nota: public.get_my_negocio_id() ya existe en la base de datos según migraciones previas
CREATE POLICY "Leads hunter visibles por negocio"
  ON public.leads_hunter FOR SELECT
  USING (negocio_id = public.get_my_negocio_id());

CREATE POLICY "Insertar leads hunter en mi negocio"
  ON public.leads_hunter FOR INSERT
  WITH CHECK (negocio_id = public.get_my_negocio_id());

CREATE POLICY "Actualizar leads hunter de mi negocio"
  ON public.leads_hunter FOR UPDATE
  USING (negocio_id = public.get_my_negocio_id());

CREATE POLICY "Borrar leads hunter de mi negocio"
  ON public.leads_hunter FOR DELETE
  USING (negocio_id = public.get_my_negocio_id());

GRANT ALL ON public.leads_hunter TO authenticated;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads_hunter;
