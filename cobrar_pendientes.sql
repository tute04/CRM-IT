-- ============================================================
-- Script para marcar todas las ventas pendientes como COBRADAS
-- Si tu modelo de negocio es "toda factura = venta ya cobrada", 
-- corré este script para limpiar las alertas viejas.
-- ============================================================

UPDATE public.ventas
SET estado = 'cobrada'
WHERE estado = 'pendiente';
