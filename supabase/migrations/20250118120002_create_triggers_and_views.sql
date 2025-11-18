-- Migration: Criar triggers e views para acordos/condenações
-- Triggers para cálculos automáticos e views para repasses pendentes

-- ============================================================================
-- Função: Calcular valor de repasse ao cliente
-- ============================================================================
create or replace function calcular_valor_repasse_cliente()
returns trigger as $$
declare
  v_forma_distribuicao text;
  v_percentual_cliente numeric;
begin
  -- Buscar configuração do acordo
  select
    forma_distribuicao,
    percentual_cliente
  into
    v_forma_distribuicao,
    v_percentual_cliente
  from public.acordos_condenacoes
  where id = new.acordo_condenacao_id;

  -- Se for distribuição integral, calcular valor de repasse
  if v_forma_distribuicao = 'integral' then
    new.valor_repasse_cliente := new.valor_bruto_credito_principal * (v_percentual_cliente / 100.0);
    -- Se não tinha status de repasse definido, definir como nao_aplicavel inicialmente
    if new.status_repasse is null then
      new.status_repasse := 'nao_aplicavel';
    end if;
  else
    -- Se for dividido ou pagamento, não há repasse
    new.valor_repasse_cliente := null;
    new.status_repasse := 'nao_aplicavel';
  end if;

  return new;
end;
$$ language plpgsql;

comment on function calcular_valor_repasse_cliente() is 'Calcula automaticamente o valor de repasse ao cliente baseado no percentual do acordo';

-- Trigger para calcular valor de repasse ao criar/atualizar parcela
create trigger trigger_calcular_valor_repasse
  before insert or update of valor_bruto_credito_principal on public.parcelas
  for each row
  execute function calcular_valor_repasse_cliente();

-- ============================================================================
-- Função: Atualizar status de parcela atrasada
-- ============================================================================
create or replace function atualizar_status_parcela_atrasada()
returns trigger as $$
begin
  -- Se a parcela está pendente e a data de vencimento passou, marcar como atrasada
  if new.status = 'pendente' and new.data_vencimento < current_date then
    new.status := 'atrasado';
  end if;

  return new;
end;
$$ language plpgsql;

comment on function atualizar_status_parcela_atrasada() is 'Marca parcela como atrasada quando data de vencimento passa';

-- Trigger para atualizar status de parcela atrasada
create trigger trigger_status_parcela_atrasada
  before insert or update on public.parcelas
  for each row
  execute function atualizar_status_parcela_atrasada();

-- ============================================================================
-- Função: Atualizar status do acordo baseado nas parcelas
-- ============================================================================
create or replace function atualizar_status_acordo()
returns trigger as $$
declare
  v_acordo_id bigint;
  v_total_parcelas integer;
  v_parcelas_pagas integer;
  v_parcelas_atrasadas integer;
  v_novo_status text;
begin
  -- Determinar o ID do acordo
  if tg_op = 'DELETE' then
    v_acordo_id := old.acordo_condenacao_id;
  else
    v_acordo_id := new.acordo_condenacao_id;
  end if;

  -- Contar parcelas por status
  select
    count(*),
    count(*) filter (where status in ('recebida', 'paga')),
    count(*) filter (where status = 'atrasado')
  into
    v_total_parcelas,
    v_parcelas_pagas,
    v_parcelas_atrasadas
  from public.parcelas
  where acordo_condenacao_id = v_acordo_id;

  -- Determinar novo status do acordo
  if v_parcelas_pagas = v_total_parcelas and v_total_parcelas > 0 then
    v_novo_status := 'pago_total';
  elsif v_parcelas_pagas > 0 then
    v_novo_status := 'pago_parcial';
  elsif v_parcelas_atrasadas > 0 then
    v_novo_status := 'atrasado';
  else
    v_novo_status := 'pendente';
  end if;

  -- Atualizar status do acordo
  update public.acordos_condenacoes
  set status = v_novo_status
  where id = v_acordo_id;

  if tg_op = 'DELETE' then
    return old;
  else
    return new;
  end if;
end;
$$ language plpgsql;

comment on function atualizar_status_acordo() is 'Atualiza status do acordo automaticamente baseado no status das parcelas';

-- Trigger para atualizar status do acordo após mudanças nas parcelas
create trigger trigger_atualizar_status_acordo
  after insert or update of status or delete on public.parcelas
  for each row
  execute function atualizar_status_acordo();

-- ============================================================================
-- Função: Atualizar status de repasse quando parcela é marcada como recebida
-- ============================================================================
create or replace function atualizar_status_repasse()
returns trigger as $$
declare
  v_forma_distribuicao text;
begin
  -- Buscar forma de distribuição do acordo
  select forma_distribuicao
  into v_forma_distribuicao
  from public.acordos_condenacoes
  where id = new.acordo_condenacao_id;

  -- Se a parcela foi marcada como recebida e é distribuição integral
  if new.status = 'recebida' and old.status != 'recebida' and v_forma_distribuicao = 'integral' then
    new.status_repasse := 'pendente_declaracao';
  end if;

  return new;
end;
$$ language plpgsql;

comment on function atualizar_status_repasse() is 'Define status de repasse como pendente_declaracao quando parcela é marcada como recebida';

-- Trigger para atualizar status de repasse
create trigger trigger_atualizar_status_repasse
  before update of status on public.parcelas
  for each row
  when (new.status = 'recebida' and old.status != 'recebida')
  execute function atualizar_status_repasse();

-- ============================================================================
-- View: Repasses Pendentes
-- ============================================================================
create or replace view repasses_pendentes as
select
  p.id as parcela_id,
  p.acordo_condenacao_id,
  p.numero_parcela,
  p.valor_bruto_credito_principal,
  p.valor_repasse_cliente,
  p.status_repasse,
  p.data_efetivacao,
  p.arquivo_declaracao_prestacao_contas,
  p.data_declaracao_anexada,
  ac.processo_id,
  ac.tipo,
  ac.valor_total as acordo_valor_total,
  ac.percentual_cliente,
  ac.numero_parcelas as acordo_numero_parcelas
from public.parcelas p
join public.acordos_condenacoes ac on p.acordo_condenacao_id = ac.id
where
  ac.forma_distribuicao = 'integral'
  and p.status = 'recebida'
  and p.status_repasse in ('pendente_declaracao', 'pendente_transferencia')
order by
  p.status_repasse,
  p.data_efetivacao;

comment on view repasses_pendentes is 'View com repasses que precisam ser processados (declaração ou transferência pendente)';

-- Grant de acesso à view para usuários autenticados
grant select on repasses_pendentes to authenticated;

-- ============================================================================
-- Job/Function: Atualizar parcelas atrasadas (para ser executado periodicamente)
-- ============================================================================
create or replace function marcar_parcelas_atrasadas()
returns integer as $$
declare
  v_parcelas_atualizadas integer;
begin
  -- Atualizar parcelas pendentes que já venceram para status 'atrasado'
  update public.parcelas
  set status = 'atrasado'
  where status = 'pendente'
    and data_vencimento < current_date;

  get diagnostics v_parcelas_atualizadas = row_count;

  return v_parcelas_atualizadas;
end;
$$ language plpgsql;

comment on function marcar_parcelas_atrasadas() is 'Marca parcelas pendentes como atrasadas quando data de vencimento passa. Executar periodicamente via cron.';
