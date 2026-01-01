-- ============================================================================
-- VIEW Materializada: processos_cliente_por_cpf
-- Relaciona clientes (por CPF) com seus processos para busca otimizada
-- Usada pelo endpoint de consulta do Agente IA WhatsApp
-- ============================================================================

-- Criar a VIEW materializada
create materialized view if not exists public.processos_cliente_por_cpf as
select
  -- Cliente
  c.cpf,
  c.nome as cliente_nome,
  c.id as cliente_id,

  -- Participacao
  pp.tipo_parte,
  pp.polo,
  pp.principal as parte_principal,

  -- Processo (campos relevantes)
  a.id as processo_id,
  a.id_pje,              -- ID do processo no PJE (necessário para captura de timeline)
  a.advogado_id,         -- ID do advogado que capturou (necessário para credenciais)
  a.numero_processo,
  a.trt,
  a.grau,
  a.classe_judicial,
  a.nome_parte_autora,
  a.nome_parte_re,
  a.descricao_orgao_julgador,
  a.codigo_status_processo,
  a.origem,
  a.data_autuacao,
  a.data_arquivamento,
  a.data_proxima_audiencia,
  a.segredo_justica,
  a.timeline_jsonb

from public.clientes c
join public.processo_partes pp
  on pp.tipo_entidade = 'cliente'
  and pp.entidade_id = c.id
join public.acervo a
  on pp.processo_id = a.id
where c.cpf is not null
  and c.ativo = true;

comment on materialized view public.processos_cliente_por_cpf is 'VIEW materializada para busca otimizada de processos por CPF do cliente. Usada pelo Agente IA WhatsApp.';

-- Indices criticos para performance
create unique index if not exists idx_processos_cliente_cpf_unique
  on public.processos_cliente_por_cpf(cpf, processo_id, grau);

create index if not exists idx_processos_cliente_cpf_busca
  on public.processos_cliente_por_cpf(cpf);

create index if not exists idx_processos_cliente_cpf_numero
  on public.processos_cliente_por_cpf(numero_processo);

-- ============================================================================
-- Funcao para refresh da VIEW
-- ============================================================================

create or replace function public.refresh_processos_cliente_por_cpf()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view concurrently public.processos_cliente_por_cpf;
end;
$$;

comment on function public.refresh_processos_cliente_por_cpf() is 'Atualiza a VIEW materializada processos_cliente_por_cpf de forma concorrente (sem bloquear leituras)';

-- ============================================================================
-- Trigger para refresh automatico apos mudancas em processo_partes
-- ============================================================================

create or replace function public.trigger_refresh_processos_cliente_por_cpf()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Apenas refresh se a entidade for cliente
  if (tg_op = 'DELETE' and old.tipo_entidade = 'cliente') or
     (tg_op = 'INSERT' and new.tipo_entidade = 'cliente') or
     (tg_op = 'UPDATE' and (old.tipo_entidade = 'cliente' or new.tipo_entidade = 'cliente')) then
    -- Agendar refresh assincrono (nao bloqueia a transacao)
    perform pg_notify('refresh_view', 'processos_cliente_por_cpf');
  end if;

  return coalesce(new, old);
end;
$$;

-- Nota: O trigger abaixo esta comentado pois refresh sincrono pode impactar performance.
-- Recomenda-se usar refresh periodico via cron ou apos capturas.
--
-- create trigger trg_refresh_processos_cliente_cpf
-- after insert or update or delete on public.processo_partes
-- for each row
-- execute function public.trigger_refresh_processos_cliente_por_cpf();
