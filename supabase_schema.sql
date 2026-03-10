-- ============================================================
-- CRM SaaS Multi-Tenant - Schema SQL Completo
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. TABLA NEGOCIOS (Tenants)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.negocios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  rubro TEXT NOT NULL DEFAULT 'General',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial', 'activo', 'bloqueado')),
  trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para buscar negocio por owner
CREATE INDEX IF NOT EXISTS idx_negocios_owner_id ON public.negocios(owner_id);

-- ============================================================
-- 2. AGREGAR COLUMNA negocio_id A TABLAS EXISTENTES
-- ============================================================

-- Agregar negocio_id a clientes
ALTER TABLE public.clientes 
  ADD COLUMN IF NOT EXISTS negocio_id UUID REFERENCES public.negocios(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_clientes_negocio_id ON public.clientes(negocio_id);

-- Agregar negocio_id a ventas
ALTER TABLE public.ventas 
  ADD COLUMN IF NOT EXISTS negocio_id UUID REFERENCES public.negocios(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_ventas_negocio_id ON public.ventas(negocio_id);

-- ============================================================
-- 3. FUNCIÓN HELPER: Obtener negocio_id del usuario autenticado
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_negocio_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM public.negocios WHERE owner_id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS) - NEGOCIOS
-- ============================================================
ALTER TABLE public.negocios ENABLE ROW LEVEL SECURITY;

-- El owner puede ver su propio negocio
CREATE POLICY "Usuarios ven su propio negocio"
  ON public.negocios FOR SELECT
  USING (owner_id = auth.uid());

-- El owner puede actualizar su propio negocio
CREATE POLICY "Usuarios actualizan su propio negocio"
  ON public.negocios FOR UPDATE
  USING (owner_id = auth.uid());

-- Permitir INSERT durante el registro (el trigger lo hace, pero por si acaso)
CREATE POLICY "Usuarios crean su negocio"
  ON public.negocios FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS) - CLIENTES
-- ============================================================
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- SELECT: Solo ver clientes de mi negocio
CREATE POLICY "Clientes visibles por negocio"
  ON public.clientes FOR SELECT
  USING (negocio_id = public.get_my_negocio_id());

-- INSERT: Solo insertar clientes en mi negocio
CREATE POLICY "Insertar clientes en mi negocio"
  ON public.clientes FOR INSERT
  WITH CHECK (negocio_id = public.get_my_negocio_id());

-- UPDATE: Solo actualizar clientes de mi negocio
CREATE POLICY "Actualizar clientes de mi negocio"
  ON public.clientes FOR UPDATE
  USING (negocio_id = public.get_my_negocio_id());

-- DELETE: Solo borrar clientes de mi negocio
CREATE POLICY "Borrar clientes de mi negocio"
  ON public.clientes FOR DELETE
  USING (negocio_id = public.get_my_negocio_id());

-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS) - VENTAS
-- ============================================================
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;

-- SELECT: Solo ver ventas de mi negocio
CREATE POLICY "Ventas visibles por negocio"
  ON public.ventas FOR SELECT
  USING (negocio_id = public.get_my_negocio_id());

-- INSERT: Solo insertar ventas en mi negocio
CREATE POLICY "Insertar ventas en mi negocio"
  ON public.ventas FOR INSERT
  WITH CHECK (negocio_id = public.get_my_negocio_id());

-- UPDATE: Solo actualizar ventas de mi negocio
CREATE POLICY "Actualizar ventas de mi negocio"
  ON public.ventas FOR UPDATE
  USING (negocio_id = public.get_my_negocio_id());

-- DELETE: Solo borrar ventas de mi negocio
CREATE POLICY "Borrar ventas de mi negocio"
  ON public.ventas FOR DELETE
  USING (negocio_id = public.get_my_negocio_id());

-- ============================================================
-- 7. TRIGGER: Crear negocio automáticamente al registrarse
-- ============================================================

-- Función que se ejecuta después del registro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_negocio_id UUID;
BEGIN
  -- Crear el negocio con datos del user_metadata
  INSERT INTO public.negocios (
    nombre,
    rubro,
    owner_id,
    plan,
    trial_ends_at
  ) VALUES (
    COALESCE(NEW.raw_user_meta_data->>'nombre_negocio', 'Mi Negocio'),
    COALESCE(NEW.raw_user_meta_data->>'rubro', 'General'),
    NEW.id,
    'trial',
    NOW() + INTERVAL '14 days'
  )
  RETURNING id INTO new_negocio_id;

  RETURN NEW;
END;
$$;

-- Trigger en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 8. FUNCIÓN: Auto-bloquear trials vencidos
-- Se puede llamar periódicamente con pg_cron o desde un endpoint
-- ============================================================
CREATE OR REPLACE FUNCTION public.bloquear_trials_vencidos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.negocios
  SET plan = 'bloqueado', updated_at = NOW()
  WHERE plan = 'trial' AND trial_ends_at < NOW();
END;
$$;

-- ============================================================
-- 9. POLÍTICA SERVICE ROLE: Para webhooks (bypasses RLS)
-- El service_role_key ya bypassa RLS por defecto en Supabase
-- No se necesitan políticas adicionales
-- ============================================================

-- ============================================================
-- 10. GRANT permisos para la función helper
-- ============================================================
GRANT EXECUTE ON FUNCTION public.get_my_negocio_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bloquear_trials_vencidos() TO service_role;
