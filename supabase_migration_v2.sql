-- ============================================================
-- ITrium CRM v2 — Migración Incremental
-- Ejecutar en Supabase SQL Editor
-- NO toca tablas existentes, solo agrega columnas y tablas nuevas
-- ============================================================

-- ============================================================
-- 1. NUEVAS COLUMNAS EN CLIENTES
-- ============================================================
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS direccion TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS notas TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS etiquetas TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ultimo_contacto DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS rubro TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- 2. NUEVAS COLUMNAS EN VENTAS
-- ============================================================
ALTER TABLE public.ventas
  ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'cobrada'
    CHECK (estado IN ('cobrada', 'pendiente', 'cancelada'));

-- ============================================================
-- 3. NUEVAS COLUMNAS EN NEGOCIOS (configuración del negocio)
-- ============================================================
ALTER TABLE public.negocios
  ADD COLUMN IF NOT EXISTS direccion TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS telefono TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS moneda TEXT DEFAULT 'ARS';

-- ============================================================
-- 4. TABLA COTIZACIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cotizaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  negocio_id UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]',
  descuento NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  notas TEXT DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'borrador'
    CHECK (estado IN ('borrador', 'enviada', 'aceptada', 'rechazada')),
  validez_dias INTEGER DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_negocio ON public.cotizaciones(negocio_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_cliente ON public.cotizaciones(cliente_id);

-- RLS para cotizaciones
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cotizaciones visibles por negocio"
  ON public.cotizaciones FOR SELECT
  USING (negocio_id = public.get_my_negocio_id());

CREATE POLICY "Insertar cotizaciones en mi negocio"
  ON public.cotizaciones FOR INSERT
  WITH CHECK (negocio_id = public.get_my_negocio_id());

CREATE POLICY "Actualizar cotizaciones de mi negocio"
  ON public.cotizaciones FOR UPDATE
  USING (negocio_id = public.get_my_negocio_id());

CREATE POLICY "Borrar cotizaciones de mi negocio"
  ON public.cotizaciones FOR DELETE
  USING (negocio_id = public.get_my_negocio_id());

-- ============================================================
-- 5. TABLA RECORDATORIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.recordatorios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  negocio_id UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  descripcion TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  completado BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recordatorios_negocio ON public.recordatorios(negocio_id);

-- RLS para recordatorios
ALTER TABLE public.recordatorios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recordatorios visibles por negocio"
  ON public.recordatorios FOR SELECT
  USING (negocio_id = public.get_my_negocio_id());

CREATE POLICY "Insertar recordatorios en mi negocio"
  ON public.recordatorios FOR INSERT
  WITH CHECK (negocio_id = public.get_my_negocio_id());

CREATE POLICY "Actualizar recordatorios de mi negocio"
  ON public.recordatorios FOR UPDATE
  USING (negocio_id = public.get_my_negocio_id());

CREATE POLICY "Borrar recordatorios de mi negocio"
  ON public.recordatorios FOR DELETE
  USING (negocio_id = public.get_my_negocio_id());

-- ============================================================
-- 6. TABLA VENDEDORES (equipo)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vendedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  negocio_id UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendedores_negocio ON public.vendedores(negocio_id);

ALTER TABLE public.vendedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendedores visibles por negocio"
  ON public.vendedores FOR SELECT
  USING (negocio_id = public.get_my_negocio_id());

CREATE POLICY "Insertar vendedores en mi negocio"
  ON public.vendedores FOR INSERT
  WITH CHECK (negocio_id = public.get_my_negocio_id());

CREATE POLICY "Actualizar vendedores de mi negocio"
  ON public.vendedores FOR UPDATE
  USING (negocio_id = public.get_my_negocio_id());

CREATE POLICY "Borrar vendedores de mi negocio"
  ON public.vendedores FOR DELETE
  USING (negocio_id = public.get_my_negocio_id());

-- ============================================================
-- 7. GRANTS
-- ============================================================
GRANT ALL ON public.cotizaciones TO authenticated;
GRANT ALL ON public.recordatorios TO authenticated;
GRANT ALL ON public.vendedores TO authenticated;

-- ============================================================
-- 8. Enable Realtime for new tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.cotizaciones;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recordatorios;
