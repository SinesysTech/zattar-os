-- Migration: Criar tabela de acordos, condenações e custas processuais
-- Permite registrar e controlar pagamentos e recebimentos relacionados a processos

create table public.acordos_condenacoes (
  id bigint generated always as identity primary key,
  processo_id bigint not null references public.acervo(id) on delete restrict,
  tipo text not null check (tipo in ('acordo', 'condenacao', 'custas_processuais')),
  direcao text not null check (direcao in ('recebimento', 'pagamento')),
  valor_total numeric(15, 2) not null check (valor_total > 0),
  data_vencimento_primeira_parcela date not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago_parcial', 'pago_total', 'atrasado')),
  numero_parcelas integer not null default 1 check (numero_parcelas > 0),

  -- Campos para acordo/condenação (NULL para custas_processuais)
  forma_distribuicao text check (forma_distribuicao in ('integral', 'dividido') or forma_distribuicao is null),
  percentual_escritorio numeric(5, 2) default 30.00 check (percentual_escritorio >= 0 and percentual_escritorio <= 100),
  percentual_cliente numeric(5, 2) generated always as (100 - percentual_escritorio) stored,

  -- Honorários Sucumbenciais
  honorarios_sucumbenciais_total numeric(15, 2) default 0 check (honorarios_sucumbenciais_total >= 0),

  -- Metadados
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id) on delete set null,

  -- Constraints de negócio
  constraint check_custas_processuais check (
    (tipo = 'custas_processuais' and direcao = 'pagamento' and forma_distribuicao is null and numero_parcelas = 1) or
    (tipo in ('acordo', 'condenacao'))
  ),
  constraint check_forma_distribuicao_recebimento check (
    (direcao = 'pagamento' and forma_distribuicao is null) or
    (direcao = 'recebimento' and tipo in ('acordo', 'condenacao'))
  )
);

comment on table public.acordos_condenacoes is 'Acordos, condenações e custas processuais vinculados a processos';
comment on column public.acordos_condenacoes.processo_id is 'ID do processo ao qual o acordo/condenação está vinculado';
comment on column public.acordos_condenacoes.tipo is 'Tipo: acordo, condenacao ou custas_processuais';
comment on column public.acordos_condenacoes.direcao is 'Direção: recebimento (escritório recebe) ou pagamento (escritório paga)';
comment on column public.acordos_condenacoes.valor_total is 'Valor total do acordo/condenação/custas';
comment on column public.acordos_condenacoes.data_vencimento_primeira_parcela is 'Data de vencimento da primeira parcela ou parcela única';
comment on column public.acordos_condenacoes.status is 'Status calculado baseado nas parcelas: pendente, pago_parcial, pago_total, atrasado';
comment on column public.acordos_condenacoes.numero_parcelas is 'Quantidade de parcelas (1 para pagamento único)';
comment on column public.acordos_condenacoes.forma_distribuicao is 'Como o valor será distribuído: integral (escritório recebe tudo e repassa) ou dividido (cada parte recebe direto)';
comment on column public.acordos_condenacoes.percentual_escritorio is 'Percentual dos honorários contratuais do escritório (padrão 30%)';
comment on column public.acordos_condenacoes.percentual_cliente is 'Percentual do cliente (calculado automaticamente: 100 - percentual_escritorio)';
comment on column public.acordos_condenacoes.honorarios_sucumbenciais_total is 'Valor total dos honorários sucumbenciais (100% do escritório, não repassados ao cliente)';

-- Índices para performance
create index idx_acordos_condenacoes_processo_id on public.acordos_condenacoes using btree (processo_id);
create index idx_acordos_condenacoes_status on public.acordos_condenacoes using btree (status);
create index idx_acordos_condenacoes_tipo_direcao on public.acordos_condenacoes using btree (tipo, direcao);
create index idx_acordos_condenacoes_data_vencimento on public.acordos_condenacoes using btree (data_vencimento_primeira_parcela);
create index idx_acordos_condenacoes_created_at on public.acordos_condenacoes using btree (created_at desc);

-- Trigger para atualizar updated_at
create trigger update_acordos_condenacoes_updated_at
  before update on public.acordos_condenacoes
  for each row
  execute function update_updated_at_column();

-- RLS (Row Level Security)
alter table public.acordos_condenacoes enable row level security;

-- Política: Permitir leitura para usuários autenticados
create policy "Usuários autenticados podem ler acordos/condenações"
  on public.acordos_condenacoes
  for select
  using (auth.role() = 'authenticated');

-- Política: Permitir criação para usuários autenticados
create policy "Usuários autenticados podem criar acordos/condenações"
  on public.acordos_condenacoes
  for insert
  with check (auth.role() = 'authenticated');

-- Política: Permitir atualização para usuários autenticados
create policy "Usuários autenticados podem atualizar acordos/condenações"
  on public.acordos_condenacoes
  for update
  using (auth.role() = 'authenticated');

-- Política: Permitir deleção para usuários autenticados
create policy "Usuários autenticados podem deletar acordos/condenações"
  on public.acordos_condenacoes
  for delete
  using (auth.role() = 'authenticated');
