-- ============================================================================
-- Tabela: representantes (estrutura final por CPF)
-- Representantes legais únicos por CPF. Vínculo com processos via processo_partes.
-- id_pessoa_pje agora é rastreado em cadastros_pje, permitindo múltiplos IDs por pessoa.
-- ============================================================================

create table if not exists public.representantes (
  id bigint generated always as identity primary key,

  -- Identificação (chave de negócio)
  cpf text not null unique,
  nome text not null,
  sexo text,

  -- Dados OAB
  numero_oab text,
  uf_oab text,
  situacao_oab text,
  tipo text,

  -- Contato
  emails jsonb,
  email text,
  ddd_celular text,
  numero_celular text,
  ddd_residencial text,
  numero_residencial text,
  ddd_comercial text,
  numero_comercial text,

  -- Metadados e endereço
  endereco_id bigint references public.enderecos(id),
  dados_anteriores jsonb,

  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Comentários
comment on table public.representantes is 'Representantes legais únicos por CPF. Vínculo com processos via processo_partes.';
comment on column public.representantes.cpf is 'CPF único do representante (constraint UNIQUE).';
comment on column public.representantes.dados_anteriores is 'Dados antigos armazenados para auditoria.';

-- Índices relevantes
create index if not exists idx_representantes_cpf on public.representantes(cpf);
create index if not exists idx_representantes_oab on public.representantes(numero_oab);
create index if not exists idx_representantes_endereco on public.representantes(endereco_id);

-- RLS
alter table public.representantes enable row level security;

create policy "Service role tem acesso total aos representantes"
on public.representantes for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler representantes"
on public.representantes for select
to authenticated
using (true);
