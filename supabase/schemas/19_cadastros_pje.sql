-- Schema: cadastros_pje
-- Descrição: Tabela unificada para mapear entidades (clientes, partes contrárias, terceiros, representantes) 
-- aos seus múltiplos IDs nos sistemas judiciais (PJE, ESAJ, etc.). 
-- Uma pessoa pode ter IDs diferentes em cada tribunal/grau.
-- Esta tabela resolve o problema de id_pessoa_pje não ser globalmente único.

-- Tabela unificada para mapear entidades aos seus IDs nos sistemas judiciais
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

-- Índices para queries frequentes
create index if not exists idx_cadastros_pje_entidade on public.cadastros_pje(tipo_entidade, entidade_id);
create index if not exists idx_cadastros_pje_id_pessoa on public.cadastros_pje(id_pessoa_pje, sistema, tribunal);
create index if not exists idx_cadastros_pje_tribunal on public.cadastros_pje(tribunal, sistema);

-- Comentário descritivo na tabela
comment on table public.cadastros_pje is 'Mapeia entidades (clientes, partes contrárias, terceiros, representantes) aos seus múltiplos IDs nos sistemas judiciais (PJE, ESAJ, etc.). Uma pessoa pode ter IDs diferentes em cada tribunal/grau.';

-- Comentários nas colunas
comment on column public.cadastros_pje.tipo_entidade is 'Tipo da entidade referenciada: cliente, parte_contraria, terceiro, representante';
comment on column public.cadastros_pje.entidade_id is 'ID da entidade na tabela correspondente';
comment on column public.cadastros_pje.id_pessoa_pje is 'ID da pessoa no sistema judicial (não é único global)';
comment on column public.cadastros_pje.sistema is 'Sistema judicial: pje_trt, pje_tst, esaj, projudi';
comment on column public.cadastros_pje.tribunal is 'Código do tribunal (TRT01, TRT03, TST, TJMG, etc.)';
comment on column public.cadastros_pje.grau is 'Grau do processo: primeiro_grau, segundo_grau, ou null';
comment on column public.cadastros_pje.dados_cadastro_pje is 'Dados extras do cadastro no sistema judicial (telefones, emails, status, etc.)';

-- Trigger para atualizar updated_at automaticamente
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_cadastros_pje_updated_at 
    before update on public.cadastros_pje 
    for each row 
    execute procedure public.update_updated_at_column();

-- Habilitar Row Level Security (RLS)
alter table public.cadastros_pje enable row level security;

-- Políticas RLS
create policy "Enable all operations for service_role" on public.cadastros_pje
    for all using (auth.role() = 'service_role');

create policy "Enable read for authenticated users" on public.cadastros_pje
    for select using (auth.role() = 'authenticated');