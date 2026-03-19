-- ============================================================
-- ITrium CRM — Migración: Soft Deletes (Borrado Lógico)
-- Ejecutar en Supabase SQL Editor
-- Agrega deleted_at a las tablas clientes y productos
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Tabla CLIENTES — agregar columna deleted_at
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Índice para que los SELECT con IS NULL sean rápidos
CREATE INDEX IF NOT EXISTS idx_clientes_deleted_at
  ON public.clientes (deleted_at)
  WHERE deleted_at IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 2. Tabla PRODUCTOS (inventario) — agregar columna deleted_at
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_productos_deleted_at
  ON public.productos (deleted_at)
  WHERE deleted_at IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 3. Actualizar las políticas RLS existentes (si existen)
--    para que el SELECT ya filtre registros con deleted_at IS NULL
--    a nivel de base de datos (doble seguridad).
--
--    NOTA: Esto es opcional. El frontend ya filtra con .is('deleted_at', null).
--    Si querés reforzar a nivel RLS, podés recrear las políticas aquí.
--    Ejemplo para clientes:
-- ─────────────────────────────────────────────────────────────

-- (Opcional) Recrear política SELECT de clientes excluyendo borrados
-- DROP POLICY IF EXISTS "Clientes visibles por negocio" ON public.clientes;
-- CREATE POLICY "Clientes visibles por negocio"
--   ON public.clientes FOR SELECT
--   USING (
--     negocio_id = public.get_my_negocio_id()
--     AND deleted_at IS NULL
--   );

-- (Opcional) Recrear política SELECT de productos excluyendo borrados
-- DROP POLICY IF EXISTS "Productos visibles por negocio" ON public.productos;
-- CREATE POLICY "Productos visibles por negocio"
--   ON public.productos FOR SELECT
--   USING (
--     negocio_id = public.get_my_negocio_id()
--     AND deleted_at IS NULL
--   );

-- ─────────────────────────────────────────────────────────────
-- 4. (Opcional) Vista para recuperar registros archivados
--    Útil para un futuro panel de "Papelera" o auditoría
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.clientes_archivados AS
  SELECT * FROM public.clientes
  WHERE deleted_at IS NOT NULL;

CREATE OR REPLACE VIEW public.productos_archivados AS
  SELECT * FROM public.productos
  WHERE deleted_at IS NOT NULL;
