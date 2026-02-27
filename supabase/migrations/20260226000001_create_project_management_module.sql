-- =============================================================================
-- Migration: Módulo de Gestão de Projetos (Project Management)
-- Cria ENUMs, tabelas, indexes, RLS policies, triggers e permissões
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. ENUMs
-- ---------------------------------------------------------------------------

CREATE TYPE public.pm_status_projeto AS ENUM (
  'planejamento',
  'ativo',
  'pausado',
  'concluido',
  'cancelado'
);
COMMENT ON TYPE public.pm_status_projeto IS 'Status de um projeto no módulo de gestão de projetos';

CREATE TYPE public.pm_status_tarefa AS ENUM (
  'a_fazer',
  'em_progresso',
  'em_revisao',
  'concluido',
  'cancelado'
);
COMMENT ON TYPE public.pm_status_tarefa IS 'Status de uma tarefa dentro de um projeto';

CREATE TYPE public.pm_prioridade AS ENUM (
  'baixa',
  'media',
  'alta',
  'urgente'
);
COMMENT ON TYPE public.pm_prioridade IS 'Nível de prioridade para projetos, tarefas e lembretes';

CREATE TYPE public.pm_papel_projeto AS ENUM (
  'gerente',
  'membro',
  'observador'
);
COMMENT ON TYPE public.pm_papel_projeto IS 'Papel de um usuário dentro de um projeto';

-- ---------------------------------------------------------------------------
-- 2. Tabela: pm_projetos
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pm_projetos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dados do projeto
  nome varchar(255) NOT NULL,
  descricao text,
  status public.pm_status_projeto NOT NULL DEFAULT 'planejamento',
  prioridade public.pm_prioridade NOT NULL DEFAULT 'media',

  -- Datas
  data_inicio date,
  data_previsao_fim date,
  data_conclusao date,

  -- Vínculos com entidades existentes (opcionais)
  cliente_id bigint REFERENCES public.clientes(id) ON DELETE SET NULL,
  processo_id bigint REFERENCES public.acervo(id) ON DELETE SET NULL,
  contrato_id bigint REFERENCES public.contratos(id) ON DELETE SET NULL,

  -- Responsável e criador
  responsavel_id bigint NOT NULL REFERENCES public.usuarios(id),
  criado_por bigint NOT NULL REFERENCES public.usuarios(id),

  -- Financeiro
  orcamento decimal(12, 2),
  valor_gasto decimal(12, 2) DEFAULT 0,

  -- Progresso
  progresso integer DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  progresso_manual integer CHECK (progresso_manual >= 0 AND progresso_manual <= 100),

  -- Metadados
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pm_projetos IS 'Projetos do módulo de gestão de projetos';
COMMENT ON COLUMN public.pm_projetos.id IS 'ID único do projeto (UUID)';
COMMENT ON COLUMN public.pm_projetos.nome IS 'Nome do projeto';
COMMENT ON COLUMN public.pm_projetos.status IS 'Status atual do projeto';
COMMENT ON COLUMN public.pm_projetos.prioridade IS 'Nível de prioridade do projeto';
COMMENT ON COLUMN public.pm_projetos.cliente_id IS 'Cliente vinculado ao projeto (opcional)';
COMMENT ON COLUMN public.pm_projetos.processo_id IS 'Processo jurídico vinculado (opcional)';
COMMENT ON COLUMN public.pm_projetos.contrato_id IS 'Contrato vinculado ao projeto (opcional)';
COMMENT ON COLUMN public.pm_projetos.responsavel_id IS 'Usuário responsável principal pelo projeto';
COMMENT ON COLUMN public.pm_projetos.progresso IS 'Percentual de progresso calculado automaticamente (0-100)';
COMMENT ON COLUMN public.pm_projetos.progresso_manual IS 'Override manual do progresso (quando definido, sobrescreve o automático)';

-- ---------------------------------------------------------------------------
-- 3. Tabela: pm_tarefas
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pm_tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Vínculo com projeto
  projeto_id uuid NOT NULL REFERENCES public.pm_projetos(id) ON DELETE CASCADE,

  -- Dados da tarefa
  titulo varchar(255) NOT NULL,
  descricao text,
  status public.pm_status_tarefa NOT NULL DEFAULT 'a_fazer',
  prioridade public.pm_prioridade NOT NULL DEFAULT 'media',

  -- Atribuição
  responsavel_id bigint REFERENCES public.usuarios(id) ON DELETE SET NULL,

  -- Datas
  data_prazo date,
  data_conclusao date,

  -- Kanban
  ordem_kanban integer NOT NULL DEFAULT 0,

  -- Horas
  estimativa_horas decimal(6, 2),
  horas_registradas decimal(6, 2) DEFAULT 0,

  -- Subtarefas (self-reference)
  tarefa_pai_id uuid REFERENCES public.pm_tarefas(id) ON DELETE CASCADE,

  -- Controle
  criado_por bigint NOT NULL REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pm_tarefas IS 'Tarefas vinculadas a projetos no módulo de gestão';
COMMENT ON COLUMN public.pm_tarefas.ordem_kanban IS 'Posição da tarefa na coluna do Kanban';
COMMENT ON COLUMN public.pm_tarefas.tarefa_pai_id IS 'Referência à tarefa pai para subtarefas';

-- ---------------------------------------------------------------------------
-- 4. Tabela: pm_membros_projeto
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pm_membros_projeto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL REFERENCES public.pm_projetos(id) ON DELETE CASCADE,
  usuario_id bigint NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  papel public.pm_papel_projeto NOT NULL DEFAULT 'membro',
  adicionado_em timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT pm_membros_projeto_unique_member UNIQUE (projeto_id, usuario_id)
);

COMMENT ON TABLE public.pm_membros_projeto IS 'Membros de cada projeto com seus papéis';

-- ---------------------------------------------------------------------------
-- 5. Tabela: pm_lembretes
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pm_lembretes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid REFERENCES public.pm_projetos(id) ON DELETE CASCADE,
  tarefa_id uuid REFERENCES public.pm_tarefas(id) ON DELETE CASCADE,
  usuario_id bigint NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  texto text NOT NULL,
  data_hora timestamptz NOT NULL,
  prioridade public.pm_prioridade NOT NULL DEFAULT 'media',
  concluido boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pm_lembretes IS 'Lembretes vinculados a projetos e/ou tarefas';

-- ---------------------------------------------------------------------------
-- 6. Tabela: pm_comentarios
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pm_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid REFERENCES public.pm_projetos(id) ON DELETE CASCADE,
  tarefa_id uuid REFERENCES public.pm_tarefas(id) ON DELETE CASCADE,
  usuario_id bigint NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  conteudo text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT pm_comentarios_target_check CHECK (
    projeto_id IS NOT NULL OR tarefa_id IS NOT NULL
  )
);

COMMENT ON TABLE public.pm_comentarios IS 'Comentários em projetos e/ou tarefas';
COMMENT ON COLUMN public.pm_comentarios.conteudo IS 'Conteúdo do comentário';

-- ---------------------------------------------------------------------------
-- 7. Tabela: pm_anexos
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pm_anexos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid REFERENCES public.pm_projetos(id) ON DELETE CASCADE,
  tarefa_id uuid REFERENCES public.pm_tarefas(id) ON DELETE CASCADE,
  usuario_id bigint NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  nome_arquivo varchar(255) NOT NULL,
  url text NOT NULL,
  tamanho_bytes bigint,
  tipo_mime varchar(100),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pm_anexos IS 'Arquivos anexados a projetos e/ou tarefas';

-- ---------------------------------------------------------------------------
-- 8. Indexes
-- ---------------------------------------------------------------------------

-- pm_projetos
CREATE INDEX IF NOT EXISTS idx_pm_projetos_status ON public.pm_projetos(status);
CREATE INDEX IF NOT EXISTS idx_pm_projetos_responsavel_id ON public.pm_projetos(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_pm_projetos_cliente_id ON public.pm_projetos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pm_projetos_created_at ON public.pm_projetos(created_at);

-- pm_tarefas
CREATE INDEX IF NOT EXISTS idx_pm_tarefas_projeto_id ON public.pm_tarefas(projeto_id);
CREATE INDEX IF NOT EXISTS idx_pm_tarefas_status ON public.pm_tarefas(status);
CREATE INDEX IF NOT EXISTS idx_pm_tarefas_responsavel_id ON public.pm_tarefas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_pm_tarefas_data_prazo ON public.pm_tarefas(data_prazo);
CREATE INDEX IF NOT EXISTS idx_pm_tarefas_kanban ON public.pm_tarefas(projeto_id, status, ordem_kanban);
CREATE INDEX IF NOT EXISTS idx_pm_tarefas_pai ON public.pm_tarefas(tarefa_pai_id);

-- pm_membros_projeto
CREATE INDEX IF NOT EXISTS idx_pm_membros_usuario_id ON public.pm_membros_projeto(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pm_membros_projeto_id ON public.pm_membros_projeto(projeto_id);

-- pm_lembretes
CREATE INDEX IF NOT EXISTS idx_pm_lembretes_usuario_id ON public.pm_lembretes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pm_lembretes_data_hora ON public.pm_lembretes(data_hora);
CREATE INDEX IF NOT EXISTS idx_pm_lembretes_concluido ON public.pm_lembretes(concluido);

-- pm_comentarios
CREATE INDEX IF NOT EXISTS idx_pm_comentarios_projeto_id ON public.pm_comentarios(projeto_id);
CREATE INDEX IF NOT EXISTS idx_pm_comentarios_tarefa_id ON public.pm_comentarios(tarefa_id);

-- pm_anexos
CREATE INDEX IF NOT EXISTS idx_pm_anexos_projeto_id ON public.pm_anexos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_pm_anexos_tarefa_id ON public.pm_anexos(tarefa_id);

-- ---------------------------------------------------------------------------
-- 9. RLS Policies
-- ---------------------------------------------------------------------------

-- Função auxiliar: verifica se o usuário é membro do projeto
CREATE OR REPLACE FUNCTION public.pm_user_has_project_access(p_projeto_id uuid, p_user_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pm_projetos
    WHERE id = p_projeto_id
      AND (responsavel_id = p_user_id OR criado_por = p_user_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.pm_membros_projeto
    WHERE projeto_id = p_projeto_id AND usuario_id = p_user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = p_user_id AND is_super_admin = true
  );
$$;

-- Função auxiliar: obtém o usuario_id a partir do auth.uid()
CREATE OR REPLACE FUNCTION public.pm_current_user_id()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- pm_projetos
ALTER TABLE public.pm_projetos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pm_projetos_service_role" ON public.pm_projetos
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "pm_projetos_select" ON public.pm_projetos
  FOR SELECT TO authenticated
  USING (
    public.pm_user_has_project_access(id, public.pm_current_user_id())
  );

CREATE POLICY "pm_projetos_insert" ON public.pm_projetos
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "pm_projetos_update" ON public.pm_projetos
  FOR UPDATE TO authenticated
  USING (
    public.pm_user_has_project_access(id, public.pm_current_user_id())
  );

CREATE POLICY "pm_projetos_delete" ON public.pm_projetos
  FOR DELETE TO authenticated
  USING (
    public.pm_user_has_project_access(id, public.pm_current_user_id())
  );

-- pm_tarefas
ALTER TABLE public.pm_tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pm_tarefas_service_role" ON public.pm_tarefas
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "pm_tarefas_select" ON public.pm_tarefas
  FOR SELECT TO authenticated
  USING (
    public.pm_user_has_project_access(projeto_id, public.pm_current_user_id())
  );

CREATE POLICY "pm_tarefas_insert" ON public.pm_tarefas
  FOR INSERT TO authenticated
  WITH CHECK (
    public.pm_user_has_project_access(projeto_id, public.pm_current_user_id())
  );

CREATE POLICY "pm_tarefas_update" ON public.pm_tarefas
  FOR UPDATE TO authenticated
  USING (
    public.pm_user_has_project_access(projeto_id, public.pm_current_user_id())
  );

CREATE POLICY "pm_tarefas_delete" ON public.pm_tarefas
  FOR DELETE TO authenticated
  USING (
    public.pm_user_has_project_access(projeto_id, public.pm_current_user_id())
  );

-- pm_membros_projeto
ALTER TABLE public.pm_membros_projeto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pm_membros_service_role" ON public.pm_membros_projeto
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "pm_membros_select" ON public.pm_membros_projeto
  FOR SELECT TO authenticated
  USING (
    public.pm_user_has_project_access(projeto_id, public.pm_current_user_id())
  );

CREATE POLICY "pm_membros_insert" ON public.pm_membros_projeto
  FOR INSERT TO authenticated
  WITH CHECK (
    public.pm_user_has_project_access(projeto_id, public.pm_current_user_id())
  );

CREATE POLICY "pm_membros_update" ON public.pm_membros_projeto
  FOR UPDATE TO authenticated
  USING (
    public.pm_user_has_project_access(projeto_id, public.pm_current_user_id())
  );

CREATE POLICY "pm_membros_delete" ON public.pm_membros_projeto
  FOR DELETE TO authenticated
  USING (
    public.pm_user_has_project_access(projeto_id, public.pm_current_user_id())
  );

-- pm_lembretes
ALTER TABLE public.pm_lembretes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pm_lembretes_service_role" ON public.pm_lembretes
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "pm_lembretes_select" ON public.pm_lembretes
  FOR SELECT TO authenticated
  USING (usuario_id = public.pm_current_user_id());

CREATE POLICY "pm_lembretes_insert" ON public.pm_lembretes
  FOR INSERT TO authenticated
  WITH CHECK (usuario_id = public.pm_current_user_id());

CREATE POLICY "pm_lembretes_update" ON public.pm_lembretes
  FOR UPDATE TO authenticated
  USING (usuario_id = public.pm_current_user_id());

CREATE POLICY "pm_lembretes_delete" ON public.pm_lembretes
  FOR DELETE TO authenticated
  USING (usuario_id = public.pm_current_user_id());

-- pm_comentarios
ALTER TABLE public.pm_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pm_comentarios_service_role" ON public.pm_comentarios
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "pm_comentarios_select" ON public.pm_comentarios
  FOR SELECT TO authenticated
  USING (
    (projeto_id IS NOT NULL AND public.pm_user_has_project_access(projeto_id, public.pm_current_user_id()))
    OR
    (tarefa_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.pm_tarefas t
      WHERE t.id = tarefa_id
        AND public.pm_user_has_project_access(t.projeto_id, public.pm_current_user_id())
    ))
  );

CREATE POLICY "pm_comentarios_insert" ON public.pm_comentarios
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "pm_comentarios_update" ON public.pm_comentarios
  FOR UPDATE TO authenticated
  USING (usuario_id = public.pm_current_user_id());

CREATE POLICY "pm_comentarios_delete" ON public.pm_comentarios
  FOR DELETE TO authenticated
  USING (usuario_id = public.pm_current_user_id());

-- pm_anexos
ALTER TABLE public.pm_anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pm_anexos_service_role" ON public.pm_anexos
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "pm_anexos_select" ON public.pm_anexos
  FOR SELECT TO authenticated
  USING (
    (projeto_id IS NOT NULL AND public.pm_user_has_project_access(projeto_id, public.pm_current_user_id()))
    OR
    (tarefa_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.pm_tarefas t
      WHERE t.id = tarefa_id
        AND public.pm_user_has_project_access(t.projeto_id, public.pm_current_user_id())
    ))
  );

CREATE POLICY "pm_anexos_insert" ON public.pm_anexos
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "pm_anexos_delete" ON public.pm_anexos
  FOR DELETE TO authenticated
  USING (usuario_id = public.pm_current_user_id());

-- ---------------------------------------------------------------------------
-- 10. Triggers de updated_at
-- ---------------------------------------------------------------------------

CREATE TRIGGER pm_projetos_updated_at
  BEFORE UPDATE ON public.pm_projetos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER pm_tarefas_updated_at
  BEFORE UPDATE ON public.pm_tarefas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER pm_comentarios_updated_at
  BEFORE UPDATE ON public.pm_comentarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 11. Permissões
-- ---------------------------------------------------------------------------

-- Inserir permissões para todos os cargos existentes (padrão: permitido = false)
-- O admin pode ativá-las por cargo/usuário depois
INSERT INTO public.cargo_permissoes (cargo_id, recurso, operacao, permitido)
SELECT c.id, p.recurso, p.operacao, false
FROM public.cargos c
CROSS JOIN (
  VALUES
    ('projetos', 'listar'),
    ('projetos', 'criar'),
    ('projetos', 'editar'),
    ('projetos', 'excluir')
) AS p(recurso, operacao)
ON CONFLICT (cargo_id, recurso, operacao) DO NOTHING;
