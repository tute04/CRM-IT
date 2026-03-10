CREATE TABLE IF NOT EXISTS productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  negocio_id UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  precio_unitario NUMERIC(12,2) DEFAULT 0,
  stock_actual NUMERIC(12,2) DEFAULT 0,
  stock_minimo NUMERIC(12,2) DEFAULT 0,
  unidad TEXT DEFAULT 'unidad',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Productos visibles por negocio"
  ON productos FOR SELECT
  USING (negocio_id = public.get_my_negocio_id());

CREATE POLICY "Insertar productos en mi negocio"
  ON productos FOR INSERT
  WITH CHECK (negocio_id = public.get_my_negocio_id());

CREATE POLICY "Actualizar productos de mi negocio"
  ON productos FOR UPDATE
  USING (negocio_id = public.get_my_negocio_id());

CREATE POLICY "Borrar productos de mi negocio"
  ON productos FOR DELETE
  USING (negocio_id = public.get_my_negocio_id());

CREATE TABLE IF NOT EXISTS pagos_sin_procesar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id TEXT,
  payment_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
