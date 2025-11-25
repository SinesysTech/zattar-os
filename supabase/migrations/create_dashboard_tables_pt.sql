DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'status_tarefa'
  ) THEN
    CREATE TYPE public.status_tarefa AS ENUM ('pendente', 'em_andamento', 'concluida');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.tarefas (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id BIGINT REFERENCES public.usuarios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status public.status_tarefa DEFAULT 'pendente' NOT NULL,
  prioridade INTEGER DEFAULT 1 CHECK (prioridade BETWEEN 1 AND 5),
  data_prevista DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tarefas_usuario_id ON public.tarefas USING BTREE (usuario_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON public.tarefas USING BTREE (status);
CREATE INDEX IF NOT EXISTS idx_tarefas_prioridade ON public.tarefas USING BTREE (prioridade);
CREATE INDEX IF NOT EXISTS idx_tarefas_data_prevista ON public.tarefas USING BTREE (data_prevista);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE TRIGGER update_tarefas_updated_at
    BEFORE UPDATE ON public.tarefas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;

ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role acesso total" ON public.tarefas;
CREATE POLICY "Service role acesso total"
  ON public.tarefas
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários autenticados gerenciam próprias tarefas" ON public.tarefas;
CREATE POLICY "Usuários autenticados gerenciam próprias tarefas"
  ON public.tarefas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = public.tarefas.usuario_id
        AND u.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = public.tarefas.usuario_id
        AND u.auth_user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS public.notas (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id BIGINT REFERENCES public.usuarios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  conteudo TEXT,
  etiquetas JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notas_usuario_id ON public.notas USING BTREE (usuario_id);
CREATE INDEX IF NOT EXISTS idx_notas_created_at ON public.notas USING BTREE (created_at DESC);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE TRIGGER update_notas_updated_at
    BEFORE UPDATE ON public.notas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;

ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role acesso total" ON public.notas;
CREATE POLICY "Service role acesso total"
  ON public.notas
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários autenticados gerenciam próprias notas" ON public.notas;
CREATE POLICY "Usuários autenticados gerenciam próprias notas"
  ON public.notas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = public.notas.usuario_id
        AND u.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = public.notas.usuario_id
        AND u.auth_user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS public.layouts_painel (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id BIGINT UNIQUE REFERENCES public.usuarios(id) ON DELETE CASCADE,
  configuracao_layout JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_layouts_painel_usuario_id ON public.layouts_painel USING BTREE (usuario_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE TRIGGER update_layouts_painel_updated_at
    BEFORE UPDATE ON public.layouts_painel
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;

ALTER TABLE public.layouts_painel ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role acesso total" ON public.layouts_painel;
CREATE POLICY "Service role acesso total"
  ON public.layouts_painel
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários autenticados gerenciam próprio layout" ON public.layouts_painel;
CREATE POLICY "Usuários autenticados gerenciam próprio layout"
  ON public.layouts_painel
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = public.layouts_painel.usuario_id
        AND u.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = public.layouts_painel.usuario_id
        AND u.auth_user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS public.links_personalizados (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id BIGINT REFERENCES public.usuarios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  url TEXT NOT NULL,
  icone TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_links_personalizados_usuario_id ON public.links_personalizados USING BTREE (usuario_id);
CREATE INDEX IF NOT EXISTS idx_links_personalizados_ordem ON public.links_personalizados USING BTREE (usuario_id, ordem);

ALTER TABLE public.links_personalizados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role acesso total" ON public.links_personalizados;
CREATE POLICY "Service role acesso total"
  ON public.links_personalizados
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários autenticados gerenciam próprios links" ON public.links_personalizados;
CREATE POLICY "Usuários autenticados gerenciam próprios links"
  ON public.links_personalizados
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = public.links_personalizados.usuario_id
        AND u.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = public.links_personalizados.usuario_id
        AND u.auth_user_id = auth.uid()
    )
  );
