-- ============================================================================
-- Migration: Correção de Performance - Indexes e RLS
-- Created: 2025-12-19
-- Description: Adiciona indexes em foreign keys sem index e consolida políticas RLS
-- ============================================================================

-- ============================================================================
-- 1. ADICIONAR INDEXES EM FOREIGN KEYS SEM INDEX
-- ============================================================================

-- centros_custo
create index if not exists idx_centros_custo_created_by 
  on public.centros_custo(created_by);

-- conciliacoes_bancarias
create index if not exists idx_conciliacoes_bancarias_conciliado_por 
  on public.conciliacoes_bancarias(conciliado_por);

-- contas_bancarias
create index if not exists idx_contas_bancarias_created_by 
  on public.contas_bancarias(created_by);

-- embeddings
create index if not exists idx_embeddings_indexed_by 
  on public.embeddings(indexed_by);

-- folhas_pagamento
create index if not exists idx_folhas_pagamento_created_by 
  on public.folhas_pagamento(created_by);

-- itens_folha_pagamento
create index if not exists idx_itens_folha_pagamento_salario_id 
  on public.itens_folha_pagamento(salario_id);

-- lancamentos_financeiros
create index if not exists idx_lancamentos_financeiros_acordo_condenacao_id 
  on public.lancamentos_financeiros(acordo_condenacao_id);
create index if not exists idx_lancamentos_financeiros_conta_bancaria_id 
  on public.lancamentos_financeiros(conta_bancaria_id);
create index if not exists idx_lancamentos_financeiros_created_by 
  on public.lancamentos_financeiros(created_by);
create index if not exists idx_lancamentos_financeiros_lancamento_origem_id 
  on public.lancamentos_financeiros(lancamento_origem_id);
create index if not exists idx_lancamentos_financeiros_parcela_id 
  on public.lancamentos_financeiros(parcela_id);
create index if not exists idx_lancamentos_financeiros_usuario_id 
  on public.lancamentos_financeiros(usuario_id);

-- orcamentos
create index if not exists idx_orcamentos_aprovado_por 
  on public.orcamentos(aprovado_por);
create index if not exists idx_orcamentos_created_by 
  on public.orcamentos(created_by);
create index if not exists idx_orcamentos_encerrado_por 
  on public.orcamentos(encerrado_por);
create index if not exists idx_orcamentos_iniciado_por 
  on public.orcamentos(iniciado_por);

-- plano_contas
create index if not exists idx_plano_contas_created_by 
  on public.plano_contas(created_by);

-- salarios
create index if not exists idx_salarios_created_by 
  on public.salarios(created_by);

-- transacoes_bancarias_importadas
create index if not exists idx_transacoes_bancarias_importadas_created_by 
  on public.transacoes_bancarias_importadas(created_by);

-- ============================================================================
-- 2. CONSOLIDAR POLÍTICAS RLS DA TABELA assistentes
-- ============================================================================

-- Remover políticas duplicadas/permissivas existentes
drop policy if exists "Authenticated users can view active assistentes" on public.assistentes;
drop policy if exists "Users can view their own assistentes" on public.assistentes;

-- Criar política consolidada que combina as condições
-- Nota: Mantemos a política original de super admins e adicionamos condições OR
-- para permitir que usuários vejam assistentes ativos ou seus próprios assistentes
create policy "Authenticated users can view assistentes"
  on public.assistentes
  for select
  to authenticated
  using (
    -- Super admins podem ver todos
    exists (
      select 1 from public.usuarios
      where id = get_current_user_id()
        and is_super_admin = true
    )
    or
    -- Usuários podem ver assistentes ativos
    ativo = true
    or
    -- Usuários podem ver seus próprios assistentes
    criado_por = get_current_user_id()
  );

