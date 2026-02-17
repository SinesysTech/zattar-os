-- Migration to seed tipos_expedientes with a complete list

DO $$
DECLARE
    tipo_name text;
    tipos_list text[] := ARRAY[
        'Aditamento à Inicial',
        'Agravo de Instrumento em Recurso de Revista',
        'Agravo de Instrumento em Recurso Ordinário',
        'Agravo Interno',
        'Apresentação de Cálculos',
        'Apresentação de Quesitos',
        'Audiência',
        'CEJUSC',
        'Contraminuta ao Agravo de Instrumento em Recurso de Revista',
        'Contraminuta ao Agravo de Instrumento em Recurso Ordinário',
        'Contraminuta ao Agravo de Petição',
        'Contraminuta ao Agravo Interno',
        'Contrarrazões ao Recurso de Revista',
        'Contrarrazões ao Recurso Ordinário',
        'Contrarrazões ao Recurso Ordinário Adesivo',
        'Contrarrazões aos Embargos de Declaração',
        'Emenda à Inicial',
        'Impugnação ao Cálculo Pericial',
        'Impugnação à Contestação',
        'Impugnação ao Cumprimento de Sentença',
        'Impugnação ao Laudo Pericial',
        'Impugnação aos Embargos de Execução',
        'Manifestação',
        'Perícia',
        'Razões Finais',
        'Recurso de Revista',
        'Recurso Ordinário',
        'Sessão de Julgamento',
        'Verificar'
    ];
    admin_id int;
BEGIN
    -- Get a default user ID for created_by (e.g., the first user found)
    -- This assumes there is at least one user in the database.
    SELECT id INTO admin_id FROM public.usuarios ORDER BY id LIMIT 1;
    
    -- If no user is found, raise a warning but proceed (should not happen in a seeded db)
    IF admin_id IS NULL THEN
        RAISE WARNING 'No user found in public.usuarios. Using NULL for created_by.';
    END IF;

    FOREACH tipo_name IN ARRAY tipos_list
    LOOP
        -- Check if the type already exists to avoid duplicates
        IF NOT EXISTS (SELECT 1 FROM public.tipos_expedientes WHERE tipo_expediente = tipo_name) THEN
            INSERT INTO public.tipos_expedientes (tipo_expediente, created_by, created_at, updated_at)
            VALUES (tipo_name, admin_id, NOW(), NOW());
        END IF;
    END LOOP;
END $$;
