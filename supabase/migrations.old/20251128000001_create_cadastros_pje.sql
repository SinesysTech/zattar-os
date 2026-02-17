-- Migration: 20251128000001_create_cadastros_pje
-- Description: Cria a tabela cadastros_pje para mapear entidades aos seus IDs nos sistemas judiciais
-- Author: Traycer.AI
-- Date: 2025-11-28

-- Criar tabela unificada para mapear entidades aos seus IDs nos sistemas judiciais
create table if not exists public.cadastros_pje (
  id bigint generated always as identity primary key,

  -- Referência polimórfica à entidade
  tipo_entidade text not null check (tipo_entidade in ('cliente', 'parte_contraria', 'terceiro', 'representante')),
  entidade_id bigint not null,

  -- Identificação no sistema judicial
  id_pessoa_pje bigint not null,
  sistema text not null default 'pje_trt' check (sistema in ('pje_trt', 'pje_tst', 'esaj', 'projudi')),
  tribunal text not null,  -- 'TRT01', 'TRT03', 'TST', 'TJMG', etc.
  grau text check (grau in ('primeiro_grau', 'segundo_grau') or grau is null),

  -- Dados extras do cadastro (telefones PJE, emails PJE, status, etc.)
  dados_cadastro_pje jsonb default '{}',

  -- Auditoria
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Constraint: Mesmo id_pessoa_pje no mesmo sistema/tribunal/grau só pode existir uma vez por tipo_entidade
  constraint cadastros_pje_unique unique (tipo_entidade, id_pessoa_pje, sistema, tribunal, grau)
);

-- Comentários descritivos na tabela e colunas
comment on table public.cadastros_pje is 'Mapeia entidades (clientes, partes contrárias, terceiros, representantes) aos seus múltiplos IDs nos sistemas judiciais (PJE, ESAJ, etc.). Uma pessoa pode ter IDs diferentes em cada tribunal/grau.';
comment on column public.cadastros_pje.tipo_entidade is 'Tipo da entidade referenciada: cliente, parte_contraria, terceiro ou representante';
comment on column public.cadastros_pje.entidade_id is 'ID da entidade na tabela correspondente (clientes.id, partes_contrarias.id, etc.)';
comment on column public.cadastros_pje.id_pessoa_pje is 'ID da pessoa no sistema judicial (PJE, ESAJ, etc.)';
comment on column public.cadastros_pje.sistema is 'Sistema judicial: pje_trt, pje_tst, esaj, projudi';
comment on column public.cadastros_pje.tribunal is 'Tribunal onde o ID é válido (TRT01, TRT03, TST, TJMG, etc.)';
comment on column public.cadastros_pje.grau is 'Grau do processo: primeiro_grau, segundo_grau ou null';
comment on column public.cadastros_pje.dados_cadastro_pje is 'Dados extras do cadastro no sistema judicial (telefones, emails, status, etc.)';

-- Índices para queries frequentes
create index idx_cadastros_pje_entidade on public.cadastros_pje(tipo_entidade, entidade_id);
create index idx_cadastros_pje_id_pessoa on public.cadastros_pje(id_pessoa_pje, sistema, tribunal);
create index idx_cadastros_pje_tribunal on public.cadastros_pje(tribunal, sistema);

-- Trigger para atualizar updated_at automaticamente
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_cadastros_pje_updated_at before update on public.cadastros_pje
    for each row execute procedure public.update_updated_at_column();

-- Habilitar RLS
alter table public.cadastros_pje enable row level security;

-- Políticas RLS
create policy "Enable all operations for service_role" on public.cadastros_pje
    for all using (auth.role() = 'service_role');

create policy "Enable read access for authenticated users" on public.cadastros_pje
    for select using (auth.role() = 'authenticated');