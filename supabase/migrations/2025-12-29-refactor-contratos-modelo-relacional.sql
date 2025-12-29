-- Refatorar modelo de dados de Contratos para relacional

-- 1) Evolução da tabela contratos
alter table public.contratos
rename column data_contratacao to cadastrado_em;

alter table public.contratos
add column if not exists papel_cliente_no_contrato text null
  check (papel_cliente_no_contrato in ('autora', 're'));

do $$
declare
  v_segmento_id bigint;
begin
  select id
  into v_segmento_id
  from public.segmentos
  where slug = 'trabalhista'
  limit 1;

  if v_segmento_id is not null then
    update public.contratos
    set segmento_id = v_segmento_id;
  end if;
end $$;

update public.contratos
set papel_cliente_no_contrato = case
  when polo_cliente = 'autor' then 'autora'
  else 're'
end
where papel_cliente_no_contrato is null;

-- 2) Tabelas novas: contrato_partes
create table if not exists public.contrato_partes (
  id bigint generated always as identity primary key,
  contrato_id bigint not null references public.contratos(id) on delete cascade,
  tipo_entidade text not null check (tipo_entidade in ('cliente', 'parte_contraria')),
  entidade_id bigint not null,
  papel_contratual text not null check (papel_contratual in ('autora', 're')),
  ordem integer not null default 0 check (ordem >= 0),
  nome_snapshot text null,
  cpf_cnpj_snapshot text null,
  created_at timestamptz not null default now(),
  unique (contrato_id, tipo_entidade, entidade_id, papel_contratual)
);

create index if not exists idx_contrato_partes_contrato_id on public.contrato_partes using btree (contrato_id);
create index if not exists idx_contrato_partes_entidade on public.contrato_partes using btree (tipo_entidade, entidade_id);
create index if not exists idx_contrato_partes_papel on public.contrato_partes using btree (papel_contratual);

alter table public.contrato_partes enable row level security;

create policy "Service role tem acesso total ao contrato_partes"
on public.contrato_partes for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler contrato_partes"
on public.contrato_partes for select
to authenticated
using (true);

create policy "Usuários autenticados podem inserir contrato_partes"
on public.contrato_partes for insert
to authenticated
with check (true);

create policy "Usuários autenticados podem atualizar contrato_partes"
on public.contrato_partes for update
to authenticated
using (true)
with check (true);

create policy "Usuários autenticados podem deletar contrato_partes"
on public.contrato_partes for delete
to authenticated
using (true);

-- 3) Tabelas novas: contrato_status_historico
create table if not exists public.contrato_status_historico (
  id bigint generated always as identity primary key,
  contrato_id bigint not null references public.contratos(id) on delete cascade,
  from_status public.status_contrato null,
  to_status public.status_contrato not null,
  changed_at timestamptz not null default now(),
  changed_by bigint null references public.usuarios(id) on delete set null,
  reason text null,
  metadata jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists idx_contrato_status_historico_contrato_id on public.contrato_status_historico using btree (contrato_id);
create index if not exists idx_contrato_status_historico_changed_at on public.contrato_status_historico using btree (changed_at);

alter table public.contrato_status_historico enable row level security;

create policy "Service role tem acesso total ao contrato_status_historico"
on public.contrato_status_historico for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler contrato_status_historico"
on public.contrato_status_historico for select
to authenticated
using (true);

create policy "Usuários autenticados podem inserir contrato_status_historico"
on public.contrato_status_historico for insert
to authenticated
with check (true);

create policy "Usuários autenticados podem atualizar contrato_status_historico"
on public.contrato_status_historico for update
to authenticated
using (true)
with check (true);

create policy "Usuários autenticados podem deletar contrato_status_historico"
on public.contrato_status_historico for delete
to authenticated
using (true);

-- Backfill mínimo do histórico (evento inicial)
insert into public.contrato_status_historico (contrato_id, from_status, to_status, changed_at, changed_by)
select
  c.id,
  null,
  c.status,
  c.cadastrado_em,
  c.created_by
from public.contratos c
where not exists (
  select 1
  from public.contrato_status_historico h
  where h.contrato_id = c.id
);

-- Backfill mínimo de contrato_partes (cliente e parte contrária principal)
insert into public.contrato_partes (contrato_id, tipo_entidade, entidade_id, papel_contratual, ordem, nome_snapshot)
select
  c.id,
  'cliente',
  c.cliente_id,
  case when c.polo_cliente = 'autor' then 'autora' else 're' end,
  0,
  cl.nome
from public.contratos c
join public.clientes cl on cl.id = c.cliente_id
where not exists (
  select 1
  from public.contrato_partes cp
  where cp.contrato_id = c.id
    and cp.tipo_entidade = 'cliente'
    and cp.entidade_id = c.cliente_id
);

insert into public.contrato_partes (contrato_id, tipo_entidade, entidade_id, papel_contratual, ordem, nome_snapshot)
select
  c.id,
  'parte_contraria',
  c.parte_contraria_id,
  case when c.polo_cliente = 'autor' then 're' else 'autora' end,
  0,
  pc.nome
from public.contratos c
join public.partes_contrarias pc on pc.id = c.parte_contraria_id
where c.parte_contraria_id is not null
  and not exists (
    select 1
    from public.contrato_partes cp
    where cp.contrato_id = c.id
      and cp.tipo_entidade = 'parte_contraria'
      and cp.entidade_id = c.parte_contraria_id
  );

-- 4) Sistema unificado de tags
create table if not exists public.tags (
  id bigint generated always as identity primary key,
  nome text not null,
  slug text not null,
  cor text null,
  created_at timestamptz not null default now(),
  unique (slug)
);

alter table public.tags enable row level security;

create policy "Service role tem acesso total ao tags"
on public.tags for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler tags"
on public.tags for select
to authenticated
using (true);

create policy "Usuários autenticados podem inserir tags"
on public.tags for insert
to authenticated
with check (true);

create table if not exists public.contrato_tags (
  id bigint generated always as identity primary key,
  contrato_id bigint not null references public.contratos(id) on delete cascade,
  tag_id bigint not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (contrato_id, tag_id)
);

create index if not exists idx_contrato_tags_contrato_id on public.contrato_tags using btree (contrato_id);
create index if not exists idx_contrato_tags_tag_id on public.contrato_tags using btree (tag_id);

alter table public.contrato_tags enable row level security;

create policy "Service role tem acesso total ao contrato_tags"
on public.contrato_tags for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler contrato_tags"
on public.contrato_tags for select
to authenticated
using (true);

create policy "Usuários autenticados podem inserir contrato_tags"
on public.contrato_tags for insert
to authenticated
with check (true);

create policy "Usuários autenticados podem deletar contrato_tags"
on public.contrato_tags for delete
to authenticated
using (true);

create table if not exists public.processo_tags (
  id bigint generated always as identity primary key,
  processo_id bigint not null references public.acervo(id) on delete cascade,
  tag_id bigint not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (processo_id, tag_id)
);

create index if not exists idx_processo_tags_processo_id on public.processo_tags using btree (processo_id);
create index if not exists idx_processo_tags_tag_id on public.processo_tags using btree (tag_id);

alter table public.processo_tags enable row level security;

create policy "Service role tem acesso total ao processo_tags"
on public.processo_tags for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler processo_tags"
on public.processo_tags for select
to authenticated
using (true);

create policy "Usuários autenticados podem inserir processo_tags"
on public.processo_tags for insert
to authenticated
with check (true);

create policy "Usuários autenticados podem deletar processo_tags"
on public.processo_tags for delete
to authenticated
using (true);

-- 5) Propagação de tags contrato→processo
create or replace function public.propagate_contrato_tags_on_contrato_processos_insert()
returns trigger
language plpgsql
as $$
begin
  insert into public.processo_tags (processo_id, tag_id)
  select new.processo_id, ct.tag_id
  from public.contrato_tags ct
  where ct.contrato_id = new.contrato_id
  on conflict (processo_id, tag_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_propagate_contrato_tags_on_contrato_processos_insert on public.contrato_processos;

create trigger trg_propagate_contrato_tags_on_contrato_processos_insert
after insert on public.contrato_processos
for each row
execute function public.propagate_contrato_tags_on_contrato_processos_insert();

create or replace function public.propagate_contrato_tags_on_contrato_tags_insert()
returns trigger
language plpgsql
as $$
begin
  insert into public.processo_tags (processo_id, tag_id)
  select cp.processo_id, new.tag_id
  from public.contrato_processos cp
  where cp.contrato_id = new.contrato_id
  on conflict (processo_id, tag_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_propagate_contrato_tags_on_contrato_tags_insert on public.contrato_tags;

create trigger trg_propagate_contrato_tags_on_contrato_tags_insert
after insert on public.contrato_tags
for each row
execute function public.propagate_contrato_tags_on_contrato_tags_insert();
