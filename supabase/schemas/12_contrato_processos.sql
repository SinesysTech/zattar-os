-- Tabela de relacionamento entre contratos e processos
-- Um contrato pode ter múltiplos processos associados

create table public.contrato_processos (
  id bigint generated always as identity primary key,
  contrato_id bigint not null references public.contratos(id) on delete cascade,
  processo_id bigint not null references public.acervo(id) on delete cascade,
  created_at timestamptz default now() not null,
  
  -- Garantir que um processo não seja associado duas vezes ao mesmo contrato
  unique (contrato_id, processo_id)
);

comment on table public.contrato_processos is 'Relacionamento entre contratos e processos. Um contrato pode ter múltiplos processos associados.';

-- Comentários dos campos
comment on column public.contrato_processos.contrato_id is 'ID do contrato';
comment on column public.contrato_processos.processo_id is 'ID do processo na tabela acervo';
comment on column public.contrato_processos.created_at is 'Data de criação do relacionamento';

-- Índices para melhor performance
create index idx_contrato_processos_contrato_id on public.contrato_processos using btree (contrato_id);
create index idx_contrato_processos_processo_id on public.contrato_processos using btree (processo_id);
create index idx_contrato_processos_contrato_processo on public.contrato_processos using btree (contrato_id, processo_id);

-- Habilitar RLS
alter table public.contrato_processos enable row level security;

