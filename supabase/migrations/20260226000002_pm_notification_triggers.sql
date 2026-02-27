-- =============================================================================
-- Migration: Triggers de notificação para o módulo de Gestão de Projetos
-- =============================================================================

-- 1. Adicionar novos tipos de notificação ao enum existente
ALTER TYPE public.tipo_notificacao_usuario ADD VALUE IF NOT EXISTS 'tarefa_atribuida';
ALTER TYPE public.tipo_notificacao_usuario ADD VALUE IF NOT EXISTS 'projeto_status_alterado';
ALTER TYPE public.tipo_notificacao_usuario ADD VALUE IF NOT EXISTS 'membro_adicionado';
ALTER TYPE public.tipo_notificacao_usuario ADD VALUE IF NOT EXISTS 'prazo_proximo';

-- 2. Adicionar coluna para entidades com UUID (PM usa UUID, não bigint)
ALTER TABLE public.notificacoes ADD COLUMN IF NOT EXISTS entidade_uuid text;

-- 3. Tornar entidade_id nullable para suportar entidades UUID-only
ALTER TABLE public.notificacoes ALTER COLUMN entidade_id DROP NOT NULL;

-- 4. Ampliar CHECK constraint para incluir tipos de entidade do PM
ALTER TABLE public.notificacoes DROP CONSTRAINT IF EXISTS notificacoes_entidade_tipo_check;
ALTER TABLE public.notificacoes ADD CONSTRAINT notificacoes_entidade_tipo_check
  CHECK (entidade_tipo IN (
    'processo', 'audiencia', 'expediente', 'pericia',
    'projeto', 'tarefa', 'membro_projeto'
  ));

-- Index para busca por entidade_uuid
CREATE INDEX IF NOT EXISTS idx_notificacoes_entidade_uuid
  ON public.notificacoes (entidade_uuid)
  WHERE entidade_uuid IS NOT NULL;

-- =============================================================================
-- 5. Função auxiliar para criar notificações PM (aceita UUID)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.criar_notificacao_pm(
  p_usuario_id bigint,
  p_tipo public.tipo_notificacao_usuario,
  p_titulo text,
  p_descricao text,
  p_entidade_tipo text,
  p_entidade_uuid text,
  p_dados_adicionais jsonb DEFAULT '{}'
) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_notificacao_id bigint;
BEGIN
  -- Validar que o usuário existe e está ativo
  IF NOT EXISTS (
    SELECT 1 FROM public.usuarios WHERE id = p_usuario_id AND ativo = true
  ) THEN
    RETURN null;
  END IF;

  INSERT INTO public.notificacoes (
    usuario_id, tipo, titulo, descricao,
    entidade_tipo, entidade_uuid, dados_adicionais
  ) VALUES (
    p_usuario_id, p_tipo, p_titulo, p_descricao,
    p_entidade_tipo, p_entidade_uuid, p_dados_adicionais
  ) RETURNING id INTO v_notificacao_id;

  -- Broadcast via Realtime para atualização em tempo real
  PERFORM realtime.send(
    'user:' || p_usuario_id::text || ':notifications',
    'notification_created',
    jsonb_build_object(
      'id', v_notificacao_id,
      'tipo', p_tipo,
      'titulo', p_titulo,
      'entidade_tipo', p_entidade_tipo,
      'entidade_uuid', p_entidade_uuid
    ),
    false
  );

  RETURN v_notificacao_id;
END;
$$;

-- =============================================================================
-- 6. Trigger: Notificar quando tarefa é atribuída a um responsável
-- =============================================================================

CREATE OR REPLACE FUNCTION public.notificar_tarefa_atribuida() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- INSERT com responsável definido, ou UPDATE que altera responsável
  IF NEW.responsavel_id IS NOT NULL
    AND (TG_OP = 'INSERT' OR OLD.responsavel_id IS DISTINCT FROM NEW.responsavel_id)
  THEN
    PERFORM public.criar_notificacao_pm(
      NEW.responsavel_id,
      'tarefa_atribuida',
      'Tarefa atribuída',
      format('A tarefa "%s" foi atribuída a você', NEW.titulo),
      'tarefa',
      NEW.id::text,
      jsonb_build_object(
        'titulo', NEW.titulo,
        'projeto_id', NEW.projeto_id::text,
        'prioridade', NEW.prioridade::text,
        'data_prazo', NEW.data_prazo
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notificar_tarefa_atribuida
  AFTER INSERT OR UPDATE ON public.pm_tarefas
  FOR EACH ROW
  EXECUTE FUNCTION public.notificar_tarefa_atribuida();

-- =============================================================================
-- 7. Trigger: Notificar todos os membros quando status do projeto muda
-- =============================================================================

CREATE OR REPLACE FUNCTION public.notificar_projeto_status_alterado() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_membro record;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    FOR v_membro IN
      SELECT usuario_id
      FROM public.pm_membros_projeto
      WHERE projeto_id = NEW.id
    LOOP
      PERFORM public.criar_notificacao_pm(
        v_membro.usuario_id,
        'projeto_status_alterado',
        'Status do projeto alterado',
        format(
          'O projeto "%s" mudou de "%s" para "%s"',
          NEW.nome, OLD.status::text, NEW.status::text
        ),
        'projeto',
        NEW.id::text,
        jsonb_build_object(
          'nome', NEW.nome,
          'status_anterior', OLD.status::text,
          'status_novo', NEW.status::text
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notificar_projeto_status_alterado
  AFTER UPDATE ON public.pm_projetos
  FOR EACH ROW
  EXECUTE FUNCTION public.notificar_projeto_status_alterado();

-- =============================================================================
-- 8. Trigger: Notificar usuário quando adicionado a um projeto
-- =============================================================================

CREATE OR REPLACE FUNCTION public.notificar_membro_adicionado() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_projeto_nome text;
BEGIN
  SELECT nome INTO v_projeto_nome
  FROM public.pm_projetos
  WHERE id = NEW.projeto_id;

  PERFORM public.criar_notificacao_pm(
    NEW.usuario_id,
    'membro_adicionado',
    'Adicionado a um projeto',
    format(
      'Você foi adicionado ao projeto "%s" como %s',
      v_projeto_nome, NEW.papel::text
    ),
    'projeto',
    NEW.projeto_id::text,
    jsonb_build_object(
      'projeto_nome', v_projeto_nome,
      'papel', NEW.papel::text
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notificar_membro_adicionado
  AFTER INSERT ON public.pm_membros_projeto
  FOR EACH ROW
  EXECUTE FUNCTION public.notificar_membro_adicionado();

-- =============================================================================
-- 9. Função: Verificar prazos próximos de tarefas (chamada via pg_cron)
--    Notifica responsáveis de tarefas com prazo nos próximos 3 dias.
--    Uso: SELECT public.verificar_prazos_tarefas_pm();
-- =============================================================================

CREATE OR REPLACE FUNCTION public.verificar_prazos_tarefas_pm() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tarefa record;
BEGIN
  FOR v_tarefa IN
    SELECT
      t.id,
      t.titulo,
      t.data_prazo,
      t.responsavel_id,
      t.projeto_id,
      p.nome AS projeto_nome
    FROM public.pm_tarefas t
    JOIN public.pm_projetos p ON p.id = t.projeto_id
    WHERE t.responsavel_id IS NOT NULL
      AND t.status NOT IN ('concluido', 'cancelado')
      AND t.data_prazo IS NOT NULL
      AND t.data_prazo::date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '3 days')
      -- Evitar notificação duplicada no mesmo dia
      AND NOT EXISTS (
        SELECT 1 FROM public.notificacoes n
        WHERE n.entidade_uuid = t.id::text
          AND n.tipo = 'prazo_proximo'
          AND n.created_at::date = CURRENT_DATE
      )
  LOOP
    PERFORM public.criar_notificacao_pm(
      v_tarefa.responsavel_id,
      'prazo_proximo',
      'Prazo próximo',
      format(
        'A tarefa "%s" do projeto "%s" vence em %s',
        v_tarefa.titulo,
        v_tarefa.projeto_nome,
        to_char(v_tarefa.data_prazo::date, 'DD/MM/YYYY')
      ),
      'tarefa',
      v_tarefa.id::text,
      jsonb_build_object(
        'titulo', v_tarefa.titulo,
        'projeto_id', v_tarefa.projeto_id::text,
        'projeto_nome', v_tarefa.projeto_nome,
        'data_prazo', v_tarefa.data_prazo
      )
    );
  END LOOP;
END;
$$;
