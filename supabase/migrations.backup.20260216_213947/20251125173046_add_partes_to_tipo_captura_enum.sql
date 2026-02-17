-- Migration: Criar enum tipo_captura e converter colunas text para enum
-- Permite rastrear tipos de captura com type safety no banco de dados
--
-- IMPORTANTE: Esta migration deve ser executada FORA de um bloco de transação
-- quando adicionar valores a um enum existente. No Supabase, isso é feito automaticamente
-- quando a migration é executada via CLI ou dashboard.

-- Etapa 1: Criar o tipo enum se não existir
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
    raise notice 'Enum tipo_captura criado com sucesso';
  else
    raise notice 'Enum tipo_captura já existe';
  end if;
end $$;

-- Etapa 2: Adicionar valor 'partes' se o enum já existir mas não tiver esse valor
-- NOTA: ALTER TYPE ADD VALUE IF NOT EXISTS só funciona no PostgreSQL 12+
-- Se o enum foi criado acima, este comando não faz nada
do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on e.enumtypid = t.oid
    where t.typname = 'tipo_captura'
    and e.enumlabel = 'partes'
  ) then
    -- Esta parte precisa rodar FORA de um bloco de transação
    -- mas o Supabase gerencia isso automaticamente
    raise notice 'Tentando adicionar valor partes ao enum';
  end if;
end $$;

-- Adicionar valor 'partes' ao enum (idempotente via tentativa)
-- Isso deve rodar FORA do bloco DO para evitar problemas de transação
alter type public.tipo_captura add value if not exists 'partes';

-- Etapa 3: Converter coluna capturas_log.tipo_captura de text para enum
do $$
begin
  -- Verificar se a coluna ainda é do tipo text
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
    and table_name = 'capturas_log'
    and column_name = 'tipo_captura'
    and data_type = 'text'
  ) then
    alter table public.capturas_log
      alter column tipo_captura type public.tipo_captura
      using tipo_captura::public.tipo_captura;
    raise notice 'Coluna capturas_log.tipo_captura convertida para enum';
  else
    raise notice 'Coluna capturas_log.tipo_captura já é enum ou não existe';
  end if;
end $$;

-- Etapa 4: Converter coluna agendamentos.tipo_captura de text para enum
do $$
begin
  -- Verificar se a coluna ainda é do tipo text
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
    and table_name = 'agendamentos'
    and column_name = 'tipo_captura'
    and data_type = 'text'
  ) then
    alter table public.agendamentos
      alter column tipo_captura type public.tipo_captura
      using tipo_captura::public.tipo_captura;
    raise notice 'Coluna agendamentos.tipo_captura convertida para enum';
  else
    raise notice 'Coluna agendamentos.tipo_captura já é enum ou não existe';
  end if;
end $$;

-- Adicionar comentários descritivos
comment on type public.tipo_captura is 'Tipo de captura de dados do PJE: acervo_geral (processos ativos), arquivados (processos arquivados), audiencias (audiências agendadas), pendentes (pendências de manifestação), partes (partes e representantes processuais)';
