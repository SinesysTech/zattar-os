-- ============================================================================
-- Migration: Correções de Performance do Supabase Advisor
-- Issues: auth_rls_initplan, multiple_permissive_policies, duplicate_index
-- ============================================================================
-- Esta migration corrige três tipos de problemas de performance:
--
-- 1. auth_rls_initplan: Políticas RLS que re-avaliam auth.uid() ou auth.role()
--    para cada linha. Solução: usar (select auth.uid()) para "cachear" o valor.
--
-- 2. multiple_permissive_policies: Múltiplas políticas permissivas para mesmo
--    role/action causam overhead. Solução: consolidar ou remover redundantes.
--
-- 3. duplicate_index: Índices duplicados ocupam espaço e degradam writes.
--    Solução: remover índice redundante.
-- ============================================================================

-- ============================================================================
-- PARTE 1: Corrigir auth_rls_initplan
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabela: usuarios
-- ----------------------------------------------------------------------------

-- Drop políticas antigas
drop policy if exists "Usuários podem ler seus próprios dados" on public.usuarios;
drop policy if exists "Usuários podem atualizar seus próprios dados" on public.usuarios;

-- Recriar com (select auth.uid()) para otimização
create policy "Usuários podem atualizar seus próprios dados"
on public.usuarios for update
to authenticated
using ((select auth.uid()) = auth_user_id)
with check ((select auth.uid()) = auth_user_id);

-- NOTA: "Usuários podem ler seus próprios dados" é removida definitivamente
-- porque já existe "Usuários autenticados podem ler outros usuários" que
-- permite leitura de todos os usuários para authenticated.
-- Isso também resolve o problema de multiple_permissive_policies.

-- ----------------------------------------------------------------------------
-- Tabela: permissoes
-- ----------------------------------------------------------------------------

drop policy if exists "Usuários podem ler suas próprias permissões" on public.permissoes;

-- Recriar com (select auth.role()) e (select auth.uid()) para otimização
-- Também mudando de public para authenticated já que só faz sentido para autenticados
create policy "Usuários podem ler suas próprias permissões"
on public.permissoes for select
to authenticated
using (
  usuario_id = (
    select u.id
    from public.usuarios u
    where u.auth_user_id = (select auth.uid())
  )
);

-- ----------------------------------------------------------------------------
-- Tabela: cadastros_pje
-- ----------------------------------------------------------------------------

-- A política atual "Enable all operations for service_role" está mal configurada:
-- - Está aplicada ao role "public" mas verifica auth.role() = 'service_role'
-- - Isso faz com que ela seja avaliada para todos os requests, incluindo authenticated
-- - Solução: aplicar diretamente ao role service_role

drop policy if exists "Enable all operations for service_role" on public.cadastros_pje;

-- Recriar para o role correto (service_role)
create policy "Service role tem acesso total a cadastros_pje"
on public.cadastros_pje for all
to service_role
using (true)
with check (true);

-- ----------------------------------------------------------------------------
-- Tabela: tarefas
-- ----------------------------------------------------------------------------

drop policy if exists "Usuários autenticados gerenciam próprias tarefas" on public.tarefas;

-- Recriar com (select auth.uid()) para otimização
create policy "Usuários autenticados gerenciam próprias tarefas"
on public.tarefas for all
to authenticated
using (
  exists (
    select 1
    from public.usuarios u
    where u.id = tarefas.usuario_id
      and u.auth_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.usuarios u
    where u.id = tarefas.usuario_id
      and u.auth_user_id = (select auth.uid())
  )
);

-- ----------------------------------------------------------------------------
-- Tabela: notas
-- ----------------------------------------------------------------------------

drop policy if exists "Usuários autenticados gerenciam próprias notas" on public.notas;

-- Recriar com (select auth.uid()) para otimização
create policy "Usuários autenticados gerenciam próprias notas"
on public.notas for all
to authenticated
using (
  exists (
    select 1
    from public.usuarios u
    where u.id = notas.usuario_id
      and u.auth_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.usuarios u
    where u.id = notas.usuario_id
      and u.auth_user_id = (select auth.uid())
  )
);

-- ----------------------------------------------------------------------------
-- Tabela: layouts_painel
-- ----------------------------------------------------------------------------

drop policy if exists "Usuários autenticados gerenciam próprio layout" on public.layouts_painel;

-- Recriar com (select auth.uid()) para otimização
create policy "Usuários autenticados gerenciam próprio layout"
on public.layouts_painel for all
to authenticated
using (
  exists (
    select 1
    from public.usuarios u
    where u.id = layouts_painel.usuario_id
      and u.auth_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.usuarios u
    where u.id = layouts_painel.usuario_id
      and u.auth_user_id = (select auth.uid())
  )
);

-- ----------------------------------------------------------------------------
-- Tabela: links_personalizados
-- ----------------------------------------------------------------------------

drop policy if exists "Usuários autenticados gerenciam próprios links" on public.links_personalizados;

-- Recriar com (select auth.uid()) para otimização
create policy "Usuários autenticados gerenciam próprios links"
on public.links_personalizados for all
to authenticated
using (
  exists (
    select 1
    from public.usuarios u
    where u.id = links_personalizados.usuario_id
      and u.auth_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.usuarios u
    where u.id = links_personalizados.usuario_id
      and u.auth_user_id = (select auth.uid())
  )
);

-- ============================================================================
-- PARTE 2: Corrigir duplicate_index
-- ============================================================================

-- Tabela: audiencias
-- Índices idx_audiencias_responsavel e idx_audiencias_responsavel_id são idênticos
-- Ambos fazem btree (responsavel_id)
-- Removendo o que tem nome menos descritivo

drop index if exists idx_audiencias_responsavel;

-- ============================================================================
-- Comentários de documentação
-- ============================================================================

comment on policy "Usuários podem atualizar seus próprios dados" on public.usuarios is 
'Permite que usuários autenticados atualizem apenas seus próprios dados. Usa (select auth.uid()) para performance.';

comment on policy "Usuários podem ler suas próprias permissões" on public.permissoes is 
'Permite que usuários autenticados leiam suas próprias permissões. Usa (select auth.uid()) para performance.';

comment on policy "Service role tem acesso total a cadastros_pje" on public.cadastros_pje is 
'Permite acesso total ao service_role para operações de captura automatizada.';

comment on policy "Usuários autenticados gerenciam próprias tarefas" on public.tarefas is 
'Permite CRUD completo de tarefas apenas para o próprio usuário. Usa (select auth.uid()) para performance.';

comment on policy "Usuários autenticados gerenciam próprias notas" on public.notas is 
'Permite CRUD completo de notas apenas para o próprio usuário. Usa (select auth.uid()) para performance.';

comment on policy "Usuários autenticados gerenciam próprio layout" on public.layouts_painel is 
'Permite CRUD completo do layout do painel apenas para o próprio usuário. Usa (select auth.uid()) para performance.';

comment on policy "Usuários autenticados gerenciam próprios links" on public.links_personalizados is 
'Permite CRUD completo de links personalizados apenas para o próprio usuário. Usa (select auth.uid()) para performance.';

