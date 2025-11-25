-- Migration: Adicionar 'partes' ao enum tipo_captura e converter colunas text para enum
-- Objetivo: Resolver divergência entre schema declarativo e migrations existentes
-- Impacto: Tabelas capturas_log e agendamentos terão tipo_captura como enum

-- ============================================================================
-- PARTE 1: Criar/Atualizar o enum tipo_captura
-- ============================================================================

-- Criar o enum se não existir (com todos os valores, incluindo 'partes')
do $$
begin
  if not exists (select 1 from pg_type where typname = 'tipo_captura') then
    create type public.tipo_captura as enum (
      'acervo_geral',
      'arquivados',
      'audiencias',
      'pendentes',
      'partes'
    );
    comment on type public.tipo_captura is 'Tipo de captura: acervo_geral, arquivados, audiencias, pendentes, partes';
    raise notice 'Enum tipo_captura criado com sucesso';
  else
    raise notice 'Enum tipo_captura já existe';
  end if;
end $$;

-- Adicionar valor 'partes' ao enum se ainda não existir
-- NOTA: ALTER TYPE ADD VALUE não pode ser executado dentro de um bloco de transação
-- Verificamos primeiro se o valor já existe para evitar erro
do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on e.enumtypid = t.oid
    where t.typname = 'tipo_captura'
      and e.enumlabel = 'partes'
  ) then
    -- Adicionar o valor 'partes' ao enum existente
    alter type public.tipo_captura add value 'partes';
    raise notice 'Valor ''partes'' adicionado ao enum tipo_captura';
  else
    raise notice 'Valor ''partes'' já existe no enum tipo_captura';
  end if;
end $$;

-- ============================================================================
-- PARTE 2: Validar dados existentes antes de converter
-- ============================================================================

-- Validar dados em capturas_log
do $$
declare
  invalid_count integer;
begin
  select count(*)
  into invalid_count
  from public.capturas_log
  where tipo_captura not in ('acervo_geral', 'arquivados', 'audiencias', 'pendentes', 'partes');

  if invalid_count > 0 then
    raise exception 'Existem % registros em capturas_log com valores inválidos de tipo_captura. Execute: SELECT DISTINCT tipo_captura FROM capturas_log WHERE tipo_captura NOT IN (''acervo_geral'', ''arquivados'', ''audiencias'', ''pendentes'', ''partes'');', invalid_count;
  end if;

  raise notice 'Validação capturas_log: todos os % registros têm valores válidos', (select count(*) from public.capturas_log);
end $$;

-- Validar dados em agendamentos
do $$
declare
  invalid_count integer;
begin
  select count(*)
  into invalid_count
  from public.agendamentos
  where tipo_captura not in ('acervo_geral', 'arquivados', 'audiencias', 'pendentes', 'partes');

  if invalid_count > 0 then
    raise exception 'Existem % registros em agendamentos com valores inválidos de tipo_captura. Execute: SELECT DISTINCT tipo_captura FROM agendamentos WHERE tipo_captura NOT IN (''acervo_geral'', ''arquivados'', ''audiencias'', ''pendentes'', ''partes'');', invalid_count;
  end if;

  raise notice 'Validação agendamentos: todos os % registros têm valores válidos', (select count(*) from public.agendamentos);
end $$;

-- ============================================================================
-- PARTE 3: Converter coluna tipo_captura de text para enum em capturas_log
-- ============================================================================

do $$
begin
  -- Verificar se a coluna já é do tipo enum
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'capturas_log'
      and column_name = 'tipo_captura'
      and data_type = 'USER-DEFINED'
      and udt_name = 'tipo_captura'
  ) then
    raise notice 'Coluna capturas_log.tipo_captura já é do tipo enum';
  else
    -- Converter coluna de text para enum
    alter table public.capturas_log
      alter column tipo_captura
      type public.tipo_captura
      using tipo_captura::public.tipo_captura;

    raise notice 'Coluna capturas_log.tipo_captura convertida para enum com sucesso';
  end if;
end $$;

-- ============================================================================
-- PARTE 4: Converter coluna tipo_captura de text para enum em agendamentos
-- ============================================================================

do $$
begin
  -- Verificar se a coluna já é do tipo enum
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'agendamentos'
      and column_name = 'tipo_captura'
      and data_type = 'USER-DEFINED'
      and udt_name = 'tipo_captura'
  ) then
    raise notice 'Coluna agendamentos.tipo_captura já é do tipo enum';
  else
    -- Converter coluna de text para enum
    alter table public.agendamentos
      alter column tipo_captura
      type public.tipo_captura
      using tipo_captura::public.tipo_captura;

    raise notice 'Coluna agendamentos.tipo_captura convertida para enum com sucesso';
  end if;
end $$;

-- ============================================================================
-- PARTE 5: Verificações finais e estatísticas
-- ============================================================================

do $$
declare
  capturas_log_type text;
  agendamentos_type text;
  enum_values text[];
begin
  -- Verificar tipo atual das colunas
  select udt_name into capturas_log_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'capturas_log'
    and column_name = 'tipo_captura';

  select udt_name into agendamentos_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'agendamentos'
    and column_name = 'tipo_captura';

  -- Listar valores do enum
  select array_agg(enumlabel order by enumsortorder) into enum_values
  from pg_enum e
  join pg_type t on e.enumtypid = t.oid
  where t.typname = 'tipo_captura';

  raise notice '=== MIGRATION CONCLUÍDA COM SUCESSO ===';
  raise notice 'Tipo capturas_log.tipo_captura: %', capturas_log_type;
  raise notice 'Tipo agendamentos.tipo_captura: %', agendamentos_type;
  raise notice 'Valores do enum tipo_captura: %', enum_values;

  -- Validação final
  if capturas_log_type = 'tipo_captura' and agendamentos_type = 'tipo_captura' then
    raise notice '✓ Ambas as tabelas agora usam o enum tipo_captura corretamente';
  else
    raise warning '⚠ Alguma coluna não foi convertida corretamente. Verifique manualmente.';
  end if;
end $$;

-- ============================================================================
-- COMENTÁRIOS FINAIS
-- ============================================================================

-- Esta migration resolve completamente o problema do enum tipo_captura:
-- 1. Cria o enum se não existir (com todos os 5 valores)
-- 2. Adiciona 'partes' se o enum existir mas não tiver esse valor
-- 3. Valida todos os dados existentes antes de converter
-- 4. Converte capturas_log.tipo_captura de text para enum
-- 5. Converte agendamentos.tipo_captura de text para enum
-- 6. É 100% idempotente - pode ser executada múltiplas vezes sem erros
-- 7. Alinhada com o schema declarativo em schemas/01_enums.sql

-- Para testar após aplicar a migration:
-- INSERT INTO public.capturas_log(tipo_captura, credencial_ids, status)
-- VALUES ('partes', ARRAY[1], 'pending');

-- Para verificar o enum:
-- SELECT enumlabel FROM pg_enum e
-- JOIN pg_type t ON e.enumtypid = t.oid
-- WHERE t.typname = 'tipo_captura'
-- ORDER BY enumsortorder;
