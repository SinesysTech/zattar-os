-- Migration: Criar tabela de parcelas de acordos/condenações
-- Permite controlar parcelas individuais com valores editáveis e controle de repasses

create table public.parcelas (
  id bigint generated always as identity primary key,
  acordo_condenacao_id bigint not null references public.acordos_condenacoes(id) on delete cascade,
  numero_parcela integer not null check (numero_parcela > 0),

  -- Valores principais (editáveis pelo usuário)
  valor_bruto_credito_principal numeric(15, 2) not null check (valor_bruto_credito_principal >= 0),
  honorarios_sucumbenciais numeric(15, 2) default 0 check (honorarios_sucumbenciais >= 0),

  -- Valores calculados automaticamente (via trigger)
  honorarios_contratuais numeric(15, 2) default 0,

  -- Datas e status
  data_vencimento date not null,
  status text not null default 'pendente' check (status in ('pendente', 'recebida', 'paga', 'atrasado')),
  data_efetivacao timestamptz,

  -- Forma de pagamento (por parcela para permitir pagamento híbrido)
  forma_pagamento text not null check (forma_pagamento in ('transferencia_direta', 'deposito_judicial', 'deposito_recursal')),
  dados_pagamento jsonb, -- Dados do depósito judicial/recursal, número de alvará, etc

  -- Controle de edição manual
  editado_manualmente boolean default false,

  -- Controle de Repasse ao Cliente (quando forma_distribuicao = 'integral')
  valor_repasse_cliente numeric(15, 2),
  status_repasse text default 'nao_aplicavel' check (status_repasse in ('nao_aplicavel', 'pendente_declaracao', 'pendente_transferencia', 'repassado')),
  arquivo_declaracao_prestacao_contas text, -- Path do arquivo no storage
  data_declaracao_anexada timestamptz,
  arquivo_comprovante_repasse text, -- Path do arquivo no storage (obrigatório para marcar como repassado)
  data_repasse timestamptz,
  usuario_repasse_id bigint references public.usuarios(id) on delete set null,

  -- Metadados
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Constraints
  constraint unique_numero_parcela_por_acordo unique (acordo_condenacao_id, numero_parcela),
  constraint check_data_efetivacao check (
    (status in ('recebida', 'paga') and data_efetivacao is not null) or
    (status in ('pendente', 'atrasado') and data_efetivacao is null)
  ),
  constraint check_repasse_declaracao check (
    (status_repasse = 'pendente_transferencia' and arquivo_declaracao_prestacao_contas is not null) or
    (status_repasse != 'pendente_transferencia')
  ),
  constraint check_repasse_comprovante check (
    (status_repasse = 'repassado' and arquivo_comprovante_repasse is not null and data_repasse is not null and usuario_repasse_id is not null) or
    (status_repasse != 'repassado')
  )
);

comment on table public.parcelas is 'Parcelas individuais de acordos, condenações ou custas processuais';
comment on column public.parcelas.acordo_condenacao_id is 'ID do acordo/condenação ao qual a parcela pertence';
comment on column public.parcelas.numero_parcela is 'Número sequencial da parcela (1, 2, 3...)';
comment on column public.parcelas.valor_bruto_credito_principal is 'Valor bruto do crédito principal da parcela (editável pelo usuário)';
comment on column public.parcelas.honorarios_sucumbenciais is 'Valor de honorários sucumbenciais nesta parcela (editável pelo usuário)';
comment on column public.parcelas.honorarios_contratuais is 'Honorários contratuais calculados automaticamente via trigger (valor_bruto * percentual_escritorio)';
comment on column public.parcelas.data_vencimento is 'Data de vencimento da parcela';
comment on column public.parcelas.status is 'Status da parcela: pendente, recebida, paga, atrasado';
comment on column public.parcelas.data_efetivacao is 'Data em que a parcela foi marcada como recebida/paga';
comment on column public.parcelas.forma_pagamento is 'Forma de pagamento: transferencia_direta, deposito_judicial, deposito_recursal';
comment on column public.parcelas.dados_pagamento is 'Dados adicionais do pagamento (número de alvará, depósito, etc)';
comment on column public.parcelas.editado_manualmente is 'Flag indicando se os valores foram editados manualmente (para controle de redistribuição)';
comment on column public.parcelas.valor_repasse_cliente is 'Valor a ser repassado ao cliente (calculado: valor_bruto * percentual_cliente)';
comment on column public.parcelas.status_repasse is 'Status do repasse: nao_aplicavel, pendente_declaracao, pendente_transferencia, repassado';
comment on column public.parcelas.arquivo_declaracao_prestacao_contas is 'Path do arquivo da declaração de prestação de contas assinada pelo cliente';
comment on column public.parcelas.data_declaracao_anexada is 'Data em que a declaração foi anexada';
comment on column public.parcelas.arquivo_comprovante_repasse is 'Path do arquivo do comprovante de transferência para o cliente (obrigatório)';
comment on column public.parcelas.data_repasse is 'Data em que o repasse ao cliente foi realizado';
comment on column public.parcelas.usuario_repasse_id is 'ID do usuário que realizou o repasse ao cliente';

-- Índices para performance
create index idx_parcelas_acordo_condenacao_id on public.parcelas using btree (acordo_condenacao_id);
create index idx_parcelas_status on public.parcelas using btree (status);
create index idx_parcelas_status_repasse on public.parcelas using btree (status_repasse) where status_repasse != 'nao_aplicavel';
create index idx_parcelas_data_vencimento on public.parcelas using btree (data_vencimento);
create index idx_parcelas_data_efetivacao on public.parcelas using btree (data_efetivacao) where data_efetivacao is not null;
create index idx_parcelas_pendentes_repasse on public.parcelas using btree (acordo_condenacao_id, status_repasse)
  where status_repasse in ('pendente_declaracao', 'pendente_transferencia');

-- Trigger para atualizar updated_at
create trigger update_parcelas_updated_at
  before update on public.parcelas
  for each row
  execute function update_updated_at_column();

-- RLS (Row Level Security)
alter table public.parcelas enable row level security;

-- Política: Permitir leitura para usuários autenticados
create policy "Usuários autenticados podem ler parcelas"
  on public.parcelas
  for select
  using (auth.role() = 'authenticated');

-- Política: Permitir criação para usuários autenticados
create policy "Usuários autenticados podem criar parcelas"
  on public.parcelas
  for insert
  with check (auth.role() = 'authenticated');

-- Política: Permitir atualização para usuários autenticados
create policy "Usuários autenticados podem atualizar parcelas"
  on public.parcelas
  for update
  using (auth.role() = 'authenticated');

-- Política: Permitir deleção para usuários autenticados
create policy "Usuários autenticados podem deletar parcelas"
  on public.parcelas
  for delete
  using (auth.role() = 'authenticated');
