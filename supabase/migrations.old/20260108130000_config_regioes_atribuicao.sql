-- ============================================================================
-- SISTEMA CONFIGURÁVEL DE ATRIBUIÇÃO DE RESPONSÁVEIS
-- ============================================================================
-- Data: 2026-01-08
-- Objetivo: Substituir a lógica hard-coded de atribuição de responsáveis por
--           uma estrutura configurável via interface
--
-- Migração:
-- 1. Criar tabela config_regioes_atribuicao
-- 2. Criar tabela config_atribuicao_estado (para round-robin)
-- 3. Migrar dados hard-coded atuais
-- 4. Atualizar função do trigger para usar a nova tabela
-- ============================================================================

-- ============================================================================
-- PARTE 1: Criar tabela de configuração de regiões
-- ============================================================================

create table if not exists public.config_regioes_atribuicao (
  id serial primary key,
  nome text not null unique,
  descricao text,
  trts text[] not null,
  responsaveis_ids bigint[] not null,
  metodo_balanceamento text not null default 'contagem_processos'
    check (metodo_balanceamento in ('contagem_processos', 'round_robin', 'desativado')),
  ativo boolean not null default true,
  prioridade int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger para atualizar updated_at
create trigger update_config_regioes_atribuicao_updated_at
  before update on config_regioes_atribuicao
  for each row
  execute function update_updated_at_column();

-- Índices
create index if not exists idx_config_regioes_ativo on config_regioes_atribuicao(ativo);
create index if not exists idx_config_regioes_trts on config_regioes_atribuicao using gin(trts);
create index if not exists idx_config_regioes_prioridade on config_regioes_atribuicao(prioridade desc);

-- Comentários
comment on table config_regioes_atribuicao is 'Configuração de regiões para atribuição automática de responsáveis em processos';
comment on column config_regioes_atribuicao.nome is 'Nome da região (ex: Sudeste, Outras Regiões)';
comment on column config_regioes_atribuicao.trts is 'Array de TRTs que pertencem a esta região';
comment on column config_regioes_atribuicao.responsaveis_ids is 'Array de IDs de usuários responsáveis por esta região';
comment on column config_regioes_atribuicao.metodo_balanceamento is 'Método de balanceamento: contagem_processos, round_robin, desativado';
comment on column config_regioes_atribuicao.prioridade is 'Prioridade da região (maior = mais prioritário). Usado quando um TRT está em múltiplas regiões.';

-- ============================================================================
-- PARTE 2: Criar tabela de estado para round-robin
-- ============================================================================

create table if not exists public.config_atribuicao_estado (
  regiao_id int primary key references config_regioes_atribuicao(id) on delete cascade,
  ultimo_responsavel_idx int not null default 0,
  updated_at timestamptz default now()
);

comment on table config_atribuicao_estado is 'Armazena o estado do round-robin por região (índice do último responsável usado)';

-- ============================================================================
-- PARTE 3: RLS (Row Level Security)
-- ============================================================================

alter table config_regioes_atribuicao enable row level security;
alter table config_atribuicao_estado enable row level security;

-- Política: Usuários autenticados podem ler
create policy "config_regioes_select_authenticated" on config_regioes_atribuicao
  for select
  using (auth.role() = 'authenticated');

-- Política: Todos podem gerenciar (simplificado - ajustar se necessário com permissões)
create policy "config_regioes_all_authenticated" on config_regioes_atribuicao
  for all
  using (auth.role() = 'authenticated');

-- Política para estado do round-robin
create policy "config_estado_all_authenticated" on config_atribuicao_estado
  for all
  using (auth.role() = 'authenticated');

-- ============================================================================
-- PARTE 4: Migrar dados hard-coded atuais
-- ============================================================================

insert into config_regioes_atribuicao (nome, descricao, trts, responsaveis_ids, metodo_balanceamento, prioridade)
values
  (
    'Sudeste',
    'TRTs da região Sudeste',
    ARRAY['TRT1', 'TRT2', 'TRT3', 'TRT15', 'TRT17'],
    ARRAY[21, 22]::bigint[],
    'contagem_processos',
    10
  ),
  (
    'Outras Regiões',
    'Demais TRTs do Brasil',
    ARRAY['TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10', 'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT16', 'TRT18', 'TRT19', 'TRT20', 'TRT21', 'TRT22', 'TRT23', 'TRT24'],
    ARRAY[24, 20]::bigint[],
    'contagem_processos',
    5
  )
on conflict (nome) do nothing;

-- ============================================================================
-- PARTE 5: Atualizar função do trigger para usar a nova tabela
-- ============================================================================

create or replace function atribuir_responsavel_processo_automatico()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_regiao record;
  v_responsavel_escolhido bigint;
  v_min_processos bigint;
  v_responsavel_candidato bigint;
  v_count_processos bigint;
  v_estado record;
  v_novo_idx int;
begin
  -- Apenas atribuir se ainda não tem responsável e é acervo geral
  if NEW.responsavel_id IS NOT NULL OR NEW.origem != 'acervo_geral' then
    return NEW;
  end if;

  -- Buscar região que contém o TRT do processo (ordenado por prioridade)
  select * into v_regiao
  from config_regioes_atribuicao
  where ativo = true
    and NEW.trt = any(trts)
  order by prioridade desc
  limit 1;

  -- Se não encontrou região configurada, não atribui
  if v_regiao is null then
    return NEW;
  end if;

  -- Verificar se há responsáveis configurados
  if v_regiao.responsaveis_ids is null or array_length(v_regiao.responsaveis_ids, 1) is null then
    return NEW;
  end if;

  -- Selecionar responsável baseado no método de balanceamento
  case v_regiao.metodo_balanceamento
    when 'desativado' then
      -- Não atribui automaticamente
      return NEW;

    when 'round_robin' then
      -- Round-robin: próximo da lista de forma circular
      select * into v_estado
      from config_atribuicao_estado
      where regiao_id = v_regiao.id;

      if v_estado is null then
        -- Primeiro uso: criar estado com índice 1
        v_novo_idx := 1;
        insert into config_atribuicao_estado (regiao_id, ultimo_responsavel_idx)
        values (v_regiao.id, 1);
      else
        -- Calcular próximo índice (circular)
        v_novo_idx := (v_estado.ultimo_responsavel_idx % array_length(v_regiao.responsaveis_ids, 1)) + 1;
        update config_atribuicao_estado
        set ultimo_responsavel_idx = v_novo_idx, updated_at = now()
        where regiao_id = v_regiao.id;
      end if;

      v_responsavel_escolhido := v_regiao.responsaveis_ids[v_novo_idx];

    else -- 'contagem_processos' (default)
      -- Balanceamento por menor carga de trabalho
      v_min_processos := 9999999;
      v_responsavel_escolhido := v_regiao.responsaveis_ids[1];

      foreach v_responsavel_candidato in array v_regiao.responsaveis_ids loop
        -- Contar processos únicos atribuídos a este responsável
        select count(distinct numero_processo) into v_count_processos
        from acervo
        where origem = 'acervo_geral'
          and responsavel_id = v_responsavel_candidato;

        -- Escolher o que tem menos processos
        if v_count_processos < v_min_processos then
          v_min_processos := v_count_processos;
          v_responsavel_escolhido := v_responsavel_candidato;
        end if;
      end loop;
  end case;

  -- Atribuir o responsável escolhido
  NEW.responsavel_id := v_responsavel_escolhido;
  return NEW;
end;
$$;

-- ============================================================================
-- COMENTÁRIOS ATUALIZADOS
-- ============================================================================
comment on function atribuir_responsavel_processo_automatico is
'Atribui automaticamente responsável para novos processos do acervo geral.
Utiliza a tabela config_regioes_atribuicao para determinar qual responsável atribuir
baseado no TRT do processo e no método de balanceamento configurado (contagem_processos, round_robin, ou desativado).';

-- ============================================================================
-- NOTAS
-- ============================================================================
-- 1. A função agora lê da tabela config_regioes_atribuicao ao invés de IDs hard-coded
-- 2. Suporta 3 métodos de balanceamento:
--    - contagem_processos: atribui ao responsável com menos processos únicos
--    - round_robin: alterna entre responsáveis de forma circular
--    - desativado: não atribui automaticamente (atribuição manual)
-- 3. Se um TRT estiver em múltiplas regiões, a região com maior prioridade é usada
-- 4. Se não houver região configurada para o TRT, o processo não recebe responsável automático
-- ============================================================================
