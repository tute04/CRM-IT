-- ============================================================
-- ITrium CRM — Migración: Sistema de Roles (Tarea 4)
-- CORRECCIÓN: La app NO tiene tabla "perfiles".
-- Los roles se almacenan en la tabla "negocios" (o como opción
-- en los user_metadata de auth.users via Supabase Auth).
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- OPCIÓN A (RECOMENDADA): Tabla de miembros del equipo
-- Permite que un negocio tenga múltiples usuarios con distintos roles.
-- Esta es la arquitectura más escalable para un SaaS multi-tenant.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.miembros_negocio (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  negocio_id   UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rol          VARCHAR(50) NOT NULL DEFAULT 'operario'
                 CHECK (rol IN ('admin', 'operario', 'supervisor')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (negocio_id, user_id)  -- un usuario solo puede tener un rol por negocio
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_miembros_negocio_id ON public.miembros_negocio(negocio_id);
CREATE INDEX IF NOT EXISTS idx_miembros_user_id    ON public.miembros_negocio(user_id);

-- RLS
ALTER TABLE public.miembros_negocio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Miembros: SELECT dentro del negocio"  ON public.miembros_negocio;
DROP POLICY IF EXISTS "Miembros: INSERT solo admin del negocio" ON public.miembros_negocio;
DROP POLICY IF EXISTS "Miembros: DELETE solo admin del negocio" ON public.miembros_negocio;
DROP POLICY IF EXISTS "Miembros: UPDATE solo admin del negocio" ON public.miembros_negocio;

CREATE POLICY "Miembros: SELECT dentro del negocio"
  ON public.miembros_negocio FOR SELECT
  USING (negocio_id = public.get_my_negocio_id());

CREATE POLICY "Miembros: INSERT solo admin del negocio"
  ON public.miembros_negocio FOR INSERT
  WITH CHECK (negocio_id = public.get_my_negocio_id());

CREATE POLICY "Miembros: UPDATE solo admin del negocio"
  ON public.miembros_negocio FOR UPDATE
  USING (negocio_id = public.get_my_negocio_id());

CREATE POLICY "Miembros: DELETE solo admin del negocio"
  ON public.miembros_negocio FOR DELETE
  USING (negocio_id = public.get_my_negocio_id());

GRANT ALL ON public.miembros_negocio TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- OPCIÓN B (simple, para el dueño): Columna rol en negocios
-- Si solo hay un usuario por negocio y querés guardar su rol
-- junto al negocio. Útil para distinguir planes en el futuro.
-- ─────────────────────────────────────────────────────────────

-- ALTER TABLE public.negocios
--   ADD COLUMN IF NOT EXISTS rol_owner VARCHAR(50) NOT NULL DEFAULT 'admin'
--     CHECK (rol_owner IN ('admin', 'operario', 'supervisor'));


-- ─────────────────────────────────────────────────────────────
-- FUNCIÓN AUXILIAR: Obtener el rol del usuario actual
-- Busca en miembros_negocio. Si no está como miembro explícito,
-- comprueba si es el owner del negocio (en ese caso es 'admin').
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_rol()
RETURNS VARCHAR AS $$
DECLARE
  v_rol VARCHAR(50);
  v_negocio_id UUID;
BEGIN
  -- Obtener el negocio del usuario
  SELECT id INTO v_negocio_id
  FROM public.negocios
  WHERE owner_id = auth.uid()
  LIMIT 1;

  -- Si es owner del negocio → siempre admin
  IF v_negocio_id IS NOT NULL THEN
    RETURN 'admin';
  END IF;

  -- Si no es owner, buscar en miembros_negocio
  SELECT rol INTO v_rol
  FROM public.miembros_negocio
  WHERE user_id = auth.uid()
  LIMIT 1;

  RETURN COALESCE(v_rol, 'operario');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_my_rol() TO authenticated;


-- ─────────────────────────────────────────────────────────────
-- POLÍTICAS RLS: TABLA VENTAS con control de roles
--
-- IMPORTANTE: Estas políticas REEMPLAZAN las políticas existentes.
-- Si Supabase lanza "policy already exists", primero ejecutá los
-- DROP POLICY de abajo y luego los CREATE POLICY.
-- ─────────────────────────────────────────────────────────────

-- DROP nombres viejos (primera versión del script):
DROP POLICY IF EXISTS "Ventas visibles por negocio"         ON public.ventas;
DROP POLICY IF EXISTS "Insertar ventas en mi negocio"       ON public.ventas;
DROP POLICY IF EXISTS "Actualizar ventas de mi negocio"     ON public.ventas;
DROP POLICY IF EXISTS "Borrar ventas de mi negocio"         ON public.ventas;
-- DROP nombres nuevos (por si se ejecutó el script antes y quedaron a medias):
DROP POLICY IF EXISTS "Ventas: SELECT segun rol"            ON public.ventas;
DROP POLICY IF EXISTS "Ventas: INSERT admin y operario"     ON public.ventas;
DROP POLICY IF EXISTS "Ventas: UPDATE admin y operario"     ON public.ventas;
DROP POLICY IF EXISTS "Ventas: DELETE solo admin"           ON public.ventas;

-- SELECT: admin, operario y supervisor pueden ver las ventas del negocio
CREATE POLICY "Ventas: SELECT segun rol"
  ON public.ventas FOR SELECT
  USING (
    negocio_id = public.get_my_negocio_id()
    AND public.get_my_rol() IN ('admin', 'operario', 'supervisor')
  );

-- INSERT: admin y operario pueden registrar ventas
CREATE POLICY "Ventas: INSERT admin y operario"
  ON public.ventas FOR INSERT
  WITH CHECK (
    negocio_id = public.get_my_negocio_id()
    AND public.get_my_rol() IN ('admin', 'operario')
  );

-- UPDATE: admin y operario pueden editar ventas
CREATE POLICY "Ventas: UPDATE admin y operario"
  ON public.ventas FOR UPDATE
  USING (
    negocio_id = public.get_my_negocio_id()
    AND public.get_my_rol() IN ('admin', 'operario')
  );

-- DELETE: SOLO admin puede eliminar ventas
-- 🔒 El operario NO puede borrar. Proteges datos críticos.
CREATE POLICY "Ventas: DELETE solo admin"
  ON public.ventas FOR DELETE
  USING (
    negocio_id = public.get_my_negocio_id()
    AND public.get_my_rol() = 'admin'
  );


-- ─────────────────────────────────────────────────────────────
-- POLÍTICAS RLS: TABLA CLIENTES con control de roles
-- ─────────────────────────────────────────────────────────────

-- DROP nombres viejos:
DROP POLICY IF EXISTS "Clientes visibles por negocio"       ON public.clientes;
DROP POLICY IF EXISTS "Insertar clientes en mi negocio"     ON public.clientes;
DROP POLICY IF EXISTS "Actualizar clientes de mi negocio"   ON public.clientes;
DROP POLICY IF EXISTS "Borrar clientes de mi negocio"       ON public.clientes;
-- DROP nombres nuevos:
DROP POLICY IF EXISTS "Clientes: SELECT segun rol"          ON public.clientes;
DROP POLICY IF EXISTS "Clientes: INSERT admin y operario"   ON public.clientes;
DROP POLICY IF EXISTS "Clientes: UPDATE admin y operario"   ON public.clientes;
DROP POLICY IF EXISTS "Clientes: DELETE solo admin"         ON public.clientes;

-- SELECT: todos los roles ven los clientes activos (sin deleted_at)
CREATE POLICY "Clientes: SELECT segun rol"
  ON public.clientes FOR SELECT
  USING (
    negocio_id = public.get_my_negocio_id()
    AND public.get_my_rol() IN ('admin', 'operario', 'supervisor')
    AND deleted_at IS NULL
  );

-- INSERT: admin y operario pueden crear clientes
CREATE POLICY "Clientes: INSERT admin y operario"
  ON public.clientes FOR INSERT
  WITH CHECK (
    negocio_id = public.get_my_negocio_id()
    AND public.get_my_rol() IN ('admin', 'operario')
  );

-- UPDATE (incluye el soft-delete via deleted_at): admin y operario
CREATE POLICY "Clientes: UPDATE admin y operario"
  ON public.clientes FOR UPDATE
  USING (
    negocio_id = public.get_my_negocio_id()
    AND public.get_my_rol() IN ('admin', 'operario')
  );

-- DELETE real (eliminación permanente): SOLO admin
CREATE POLICY "Clientes: DELETE solo admin"
  ON public.clientes FOR DELETE
  USING (
    negocio_id = public.get_my_negocio_id()
    AND public.get_my_rol() = 'admin'
  );


-- ─────────────────────────────────────────────────────────────
-- EJEMPLO: Agregar un empleado como operario a un negocio
-- (reemplazá los UUIDs con los valores reales)
-- ─────────────────────────────────────────────────────────────
/*
INSERT INTO public.miembros_negocio (negocio_id, user_id, rol)
VALUES (
  'uuid-del-negocio-aqui',
  'uuid-del-usuario-empleado-aqui',
  'operario'
);
*/

-- ─────────────────────────────────────────────────────────────
-- RESUMEN DE ROLES:
--
-- admin     → Dueño del negocio (detectado por ser owner del negocio).
--             Acceso total: SELECT, INSERT, UPDATE, DELETE.
--
-- operario  → Empleado agregado en miembros_negocio.
--             Puede: SELECT, INSERT, UPDATE.
--             NO PUEDE: DELETE de ventas ni clientes.
--
-- supervisor→ Solo puede hacer SELECT (lectura de reportes).
--             No puede agregar ni modificar datos.
-- ─────────────────────────────────────────────────────────────
