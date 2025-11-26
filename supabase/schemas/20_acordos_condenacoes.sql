-- ============================================================================
-- Tabela: acordos_condenacoes
-- Acordos, condenações e custas processuais vinculados a processos
-- ============================================================================

create table if not exists public.acordos_condenacoes (
  id bigint generated always as identity primary key,
  processo_id bigint not null references public.acervo(id),
  tipo text not null check (tipo in ('acordo', 'condenacao', 'custas_processuais')),
  direcao text not null check (direcao in ('recebimento', 'pagamento')),
  valor_total numeric not null check (valor_total > 0),
  data_vencimento_primeira_parcela date not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago_parcial', 'pago_total', 'atrasado')),
  numero_parcelas integer not null default 1 check (numero_parcelas > 0),
  forma_distribuicao text check (forma_distribuicao in ('integral', 'dividido')),
  percentual_escritorio numeric default 30.00 check (percentual_escritorio >= 0 and percentual_escritorio <= 100),
  percentual_cliente numeric generated always as (100 - percentual_escritorio) stored,
  honorarios_sucumbenciais_total numeric default 0 check (honorarios_sucumbenciais_total >= 0),
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.acordos_condenacoes is 'Acordos, condenações e custas processuais vinculados a processos';
comment on column public.acordos_condenacoes.processo_id is 'ID do processo ao qual o acordo/condenação está vinculado';
comment on column public.acordos_condenacoes.tipo is 'Tipo: acordo, condenacao ou custas_processuais';
comment on column public.acordos_condenacoes.direcao is 'Direção: recebimento (escritório recebe) ou pagamento (escritório paga)';
comment on column public.acordos_condenacoes.valor_total is 'Valor total do acordo/condenação/custas';
comment on column public.acordos_condenacoes.data_vencimento_primeira_parcela is 'Data de vencimento da primeira parcela ou parcela única';
comment on column public.acordos_condenacoes.status is 'Status calculado baseado nas parcelas: pendente, pago_parcial, pago_total, atrasado';
comment on column public.acordos_condenacoes.numero_parcelas is 'Quantidade de parcelas (1 para pagamento único)';
comment on column public.acordos_condenacoes.forma_distribuicao is 'Como o valor será distribuído: integral ou dividido';
comment on column public.acordos_condenacoes.percentual_escritorio is 'Percentual dos honorários contratuais do escritório (padrão 30%)';
comment on column public.acordos_condenacoes.percentual_cliente is 'Percentual do cliente (calculado automaticamente: 100 - percentual_escritorio)';
comment on column public.acordos_condenacoes.honorarios_sucumbenciais_total is 'Valor total dos honorários sucumbenciais (100% do escritório)';

-- Índices
create index if not exists idx_acordos_condenacoes_processo on public.acordos_condenacoes(processo_id);
create index if not exists idx_acordos_condenacoes_tipo on public.acordos_condenacoes(tipo);
create index if not exists idx_acordos_condenacoes_status on public.acordos_condenacoes(status);
create index if not exists idx_acordos_condenacoes_direcao on public.acordos_condenacoes(direcao);

-- RLS
alter table public.acordos_condenacoes enable row level security;

create policy "Service role tem acesso total a acordos_condenacoes"
on public.acordos_condenacoes for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler acordos_condenacoes"
on public.acordos_condenacoes for select
to authenticated
using (true);


-- ============================================================================
-- Tabela: parcelas
-- Parcelas individuais de acordos, condenações ou custas processuais
-- ============================================================================

create table if not exists public.parcelas (
  id bigint generated always as identity primary key,
  acordo_condenacao_id bigint not null references public.acordos_condenacoes(id) on delete cascade,
  numero_parcela integer not null check (numero_parcela > 0),
  valor_bruto_credito_principal numeric not null check (valor_bruto_credito_principal >= 0),
  honorarios_sucumbenciais numeric default 0 check (honorarios_sucumbenciais >= 0),
  honorarios_contratuais numeric default 0,
  data_vencimento date not null,
  status text not null default 'pendente' check (status in ('pendente', 'recebida', 'paga', 'atrasado')),
  data_efetivacao timestamp with time zone,
  forma_pagamento text not null check (forma_pagamento in ('transferencia_direta', 'deposito_judicial', 'deposito_recursal')),
  dados_pagamento jsonb,
  editado_manualmente boolean default false,
  valor_repasse_cliente numeric,
  status_repasse text default 'nao_aplicavel' check (status_repasse in ('nao_aplicavel', 'pendente_declaracao', 'pendente_transferencia', 'repassado')),
  arquivo_declaracao_prestacao_contas text,
  data_declaracao_anexada timestamp with time zone,
  arquivo_comprovante_repasse text,
  data_repasse timestamp with time zone,
  usuario_repasse_id bigint references public.usuarios(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  unique (acordo_condenacao_id, numero_parcela)
);

comment on table public.parcelas is 'Parcelas individuais de acordos, condenações ou custas processuais';
comment on column public.parcelas.acordo_condenacao_id is 'ID do acordo/condenação ao qual a parcela pertence';
comment on column public.parcelas.numero_parcela is 'Número sequencial da parcela (1, 2, 3...)';
comment on column public.parcelas.valor_bruto_credito_principal is 'Valor bruto do crédito principal da parcela';
comment on column public.parcelas.honorarios_sucumbenciais is 'Valor de honorários sucumbenciais nesta parcela';
comment on column public.parcelas.honorarios_contratuais is 'Honorários contratuais calculados via trigger';
comment on column public.parcelas.data_vencimento is 'Data de vencimento da parcela';
comment on column public.parcelas.status is 'Status da parcela: pendente, recebida, paga, atrasado';
comment on column public.parcelas.data_efetivacao is 'Data em que a parcela foi marcada como recebida/paga';
comment on column public.parcelas.forma_pagamento is 'Forma de pagamento: transferencia_direta, deposito_judicial, deposito_recursal';
comment on column public.parcelas.dados_pagamento is 'Dados adicionais do pagamento (número de alvará, etc)';
comment on column public.parcelas.editado_manualmente is 'Flag indicando se os valores foram editados manualmente';
comment on column public.parcelas.valor_repasse_cliente is 'Valor a ser repassado ao cliente';
comment on column public.parcelas.status_repasse is 'Status do repasse: nao_aplicavel, pendente_declaracao, pendente_transferencia, repassado';
comment on column public.parcelas.arquivo_declaracao_prestacao_contas is 'Path do arquivo da declaração de prestação de contas';
comment on column public.parcelas.data_declaracao_anexada is 'Data em que a declaração foi anexada';
comment on column public.parcelas.arquivo_comprovante_repasse is 'Path do arquivo do comprovante de transferência';
comment on column public.parcelas.data_repasse is 'Data em que o repasse ao cliente foi realizado';
comment on column public.parcelas.usuario_repasse_id is 'ID do usuário que realizou o repasse';

-- Índices
create index if not exists idx_parcelas_acordo on public.parcelas(acordo_condenacao_id);
create index if not exists idx_parcelas_status on public.parcelas(status);
create index if not exists idx_parcelas_vencimento on public.parcelas(data_vencimento);
create index if not exists idx_parcelas_status_repasse on public.parcelas(status_repasse);

-- RLS
alter table public.parcelas enable row level security;

create policy "Service role tem acesso total a parcelas"
on public.parcelas for all
to service_role
using (true)
with check (true);

create policy "Usuários autenticados podem ler parcelas"
on public.parcelas for select
to authenticated
using (true);
