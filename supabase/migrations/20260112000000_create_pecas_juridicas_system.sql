-- Sistema de Peças Jurídicas: Modelos e Documentos vinculados a Contratos

-- 1) Enum para tipos de peças jurídicas
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'tipo_peca_juridica'
      and n.nspname = 'public'
  ) then
    execute 'create type public.tipo_peca_juridica as enum (
      ''peticao_inicial'',
      ''contestacao'',
      ''recurso_ordinario'',
      ''agravo'',
      ''embargos_declaracao'',
      ''manifestacao'',
      ''parecer'',
      ''contrato_honorarios'',
      ''procuracao'',
      ''outro''
    )';
  end if;
end $$;

-- 2) Tabela pecas_modelos - Armazena modelos de peças jurídicas
create table if not exists public.pecas_modelos (
  id bigint generated always as identity primary key,
  titulo text not null,
  descricao text null,
  tipo_peca public.tipo_peca_juridica not null default 'outro',
  conteudo jsonb not null default '[]'::jsonb,
  placeholders_definidos text[] not null default '{}',
  visibilidade text not null default 'privado' check (visibilidade in ('publico', 'privado')),
  segmento_id bigint null references public.segmentos(id) on delete set null,
  criado_por bigint null references public.usuarios(id) on delete set null,
  ativo boolean not null default true,
  uso_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pecas_modelos_tipo_peca on public.pecas_modelos using btree (tipo_peca);
create index if not exists idx_pecas_modelos_visibilidade on public.pecas_modelos using btree (visibilidade);
create index if not exists idx_pecas_modelos_criado_por on public.pecas_modelos using btree (criado_por);
create index if not exists idx_pecas_modelos_ativo on public.pecas_modelos using btree (ativo) where ativo = true;
create index if not exists idx_pecas_modelos_segmento_id on public.pecas_modelos using btree (segmento_id);

alter table public.pecas_modelos enable row level security;

create policy "Service role tem acesso total ao pecas_modelos"
on public.pecas_modelos for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler pecas_modelos públicos ou próprios"
on public.pecas_modelos for select
to authenticated
using (
  visibilidade = 'publico'
  or criado_por = (select auth.uid()::text::bigint)
  or ativo = true
);

create policy "Usuários autenticados podem inserir pecas_modelos"
on public.pecas_modelos for insert
to authenticated
with check (true);

create policy "Usuários autenticados podem atualizar pecas_modelos próprios"
on public.pecas_modelos for update
to authenticated
using (criado_por = (select auth.uid()::text::bigint) or visibilidade = 'publico')
with check (true);

create policy "Usuários autenticados podem deletar pecas_modelos próprios"
on public.pecas_modelos for delete
to authenticated
using (criado_por = (select auth.uid()::text::bigint));

-- 3) Tabela contrato_documentos - Vincula documentos gerados a contratos
create table if not exists public.contrato_documentos (
  id bigint generated always as identity primary key,
  contrato_id bigint not null references public.contratos(id) on delete cascade,
  documento_id bigint not null references public.documentos(id) on delete cascade,
  gerado_de_modelo_id bigint null references public.pecas_modelos(id) on delete set null,
  tipo_peca public.tipo_peca_juridica null,
  observacoes text null,
  created_by bigint null references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (contrato_id, documento_id)
);

create index if not exists idx_contrato_documentos_contrato_id on public.contrato_documentos using btree (contrato_id);
create index if not exists idx_contrato_documentos_documento_id on public.contrato_documentos using btree (documento_id);
create index if not exists idx_contrato_documentos_modelo_id on public.contrato_documentos using btree (gerado_de_modelo_id);
create index if not exists idx_contrato_documentos_tipo_peca on public.contrato_documentos using btree (tipo_peca);

alter table public.contrato_documentos enable row level security;

create policy "Service role tem acesso total ao contrato_documentos"
on public.contrato_documentos for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler contrato_documentos"
on public.contrato_documentos for select
to authenticated
using (true);

create policy "Usuários autenticados podem inserir contrato_documentos"
on public.contrato_documentos for insert
to authenticated
with check (true);

create policy "Usuários autenticados podem atualizar contrato_documentos"
on public.contrato_documentos for update
to authenticated
using (true)
with check (true);

create policy "Usuários autenticados podem deletar contrato_documentos"
on public.contrato_documentos for delete
to authenticated
using (true);

-- 4) Trigger para atualizar updated_at em pecas_modelos
create or replace function public.update_pecas_modelos_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_pecas_modelos_updated_at on public.pecas_modelos;

create trigger trg_pecas_modelos_updated_at
before update on public.pecas_modelos
for each row
execute function public.update_pecas_modelos_updated_at();

-- 5) Função para incrementar uso_count do modelo ao gerar documento
create or replace function public.increment_pecas_modelo_uso()
returns trigger
language plpgsql
as $$
begin
  if new.gerado_de_modelo_id is not null then
    update public.pecas_modelos
    set uso_count = uso_count + 1
    where id = new.gerado_de_modelo_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_increment_pecas_modelo_uso on public.contrato_documentos;

create trigger trg_increment_pecas_modelo_uso
after insert on public.contrato_documentos
for each row
execute function public.increment_pecas_modelo_uso();
