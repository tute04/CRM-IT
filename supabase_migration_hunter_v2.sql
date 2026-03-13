-- ============================================================
-- Mejoras para Lead Hunter AI (Scoring, Scraping y Conversión)
-- ============================================================

-- Agregar columnas nuevas a la tabla leads_hunter
ALTER TABLE public.leads_hunter 
ADD COLUMN IF NOT EXISTS scoring INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS scoring_motivo TEXT,
ADD COLUMN IF NOT EXISTS contenido_web TEXT,
ADD COLUMN IF NOT EXISTS convertido_cliente_id UUID REFERENCES public.clientes(id);

-- Comentario para documentar las columnas
COMMENT ON COLUMN public.leads_hunter.scoring IS 'Puntaje de 1 a 10 de qué tan buen prospecto es';
COMMENT ON COLUMN public.leads_hunter.contenido_web IS 'Texto extraído del sitio web para personalización';
