-- ============================================================
-- Script para fusionar clientes duplicados
-- Copiá esto y pegalo en el SQL Editor de Supabase
-- ============================================================

DO $$
DECLARE
    r RECORD;
    main_client_id UUID;
    duplicados_ids UUID[];
BEGIN
    -- Buscamos grupos de clientes que, quitando espacios y puntos, se llamen igual
    -- Ejemplo: "Avant S. A.", "AVANT S A" y "avantsa" se agrupan juntos.
    FOR r IN (
        SELECT 
            -- Normaliza el nombre: minúsculas, saca TODO lo que no sea letra o número
            regexp_replace(lower(nombre), '[^a-z0-9]', '', 'g') as name_norm,
            -- Arma un array con todos los IDs de ese grupo, ordenados del más viejo al más nuevo
            array_agg(id ORDER BY created_at ASC) as client_ids
        FROM public.clientes
        WHERE deleted_at IS NULL
        GROUP BY 1
        HAVING count(*) > 1 -- Solo seleccionamos los que tienen más de 1 registrado
    )
    LOOP
        -- El cliente "Principal" (el que se queda) será el más antiguo
        main_client_id := r.client_ids[1];
        
        -- Los duplicados son todos los demás del array (desde la posición 2 en adelante)
        duplicados_ids := r.client_ids[2:array_length(r.client_ids, 1)];

        -- 1. Pasamos todas las ventas de los clientes duplicados al cliente Principal
        UPDATE public.ventas
        SET cliente_id = main_client_id
        WHERE cliente_id = ANY(duplicados_ids);

        -- 2. Actualizamos la fecha de último contacto del cliente Principal (si alguno de los duplicados tiene una más reciente)
        UPDATE public.clientes
        SET ultimo_contacto = (
            SELECT MAX(ultimo_contacto) 
            FROM public.clientes 
            WHERE id = ANY(r.client_ids)
        )
        WHERE id = main_client_id;

        -- 3. Archivamos (soft-delete) los clientes duplicados
        UPDATE public.clientes
        SET deleted_at = NOW()
        WHERE id = ANY(duplicados_ids);

    END LOOP;
END $$;
