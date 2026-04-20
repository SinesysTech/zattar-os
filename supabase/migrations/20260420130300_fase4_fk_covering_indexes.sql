-- Fase 4: Fix advisor 0001_unindexed_foreign_keys
-- Cria indice btree em cada FK sem cobertura. IF NOT EXISTS p/ idempotencia.

CREATE INDEX IF NOT EXISTS idx_acervo_classe_judicial_id ON public.acervo (classe_judicial_id);
CREATE INDEX IF NOT EXISTS idx_agenda_eventos_criado_por ON public.agenda_eventos (criado_por);
CREATE INDEX IF NOT EXISTS idx_assinatura_digital_pacote_documentos_documento_id ON public.assinatura_digital_pacote_documentos (documento_id);
CREATE INDEX IF NOT EXISTS idx_assinatura_digital_pacotes_criado_por ON public.assinatura_digital_pacotes (criado_por);
CREATE INDEX IF NOT EXISTS idx_assinatura_digital_pacotes_formulario_id ON public.assinatura_digital_pacotes (formulario_id);
CREATE INDEX IF NOT EXISTS idx_comunica_cnj_sync_log_executado_por ON public.comunica_cnj_sync_log (executado_por);
CREATE INDEX IF NOT EXISTS idx_comunica_cnj_views_criado_por ON public.comunica_cnj_views (criado_por);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_column_id ON public.kanban_tasks (column_id);
CREATE INDEX IF NOT EXISTS idx_pm_anexos_usuario_id ON public.pm_anexos (usuario_id);
CREATE INDEX IF NOT EXISTS idx_pm_comentarios_usuario_id ON public.pm_comentarios (usuario_id);
CREATE INDEX IF NOT EXISTS idx_pm_lembretes_projeto_id ON public.pm_lembretes (projeto_id);
CREATE INDEX IF NOT EXISTS idx_pm_lembretes_tarefa_id ON public.pm_lembretes (tarefa_id);
CREATE INDEX IF NOT EXISTS idx_pm_projetos_contrato_id ON public.pm_projetos (contrato_id);
CREATE INDEX IF NOT EXISTS idx_pm_projetos_criado_por ON public.pm_projetos (criado_por);
CREATE INDEX IF NOT EXISTS idx_pm_projetos_processo_id ON public.pm_projetos (processo_id);
CREATE INDEX IF NOT EXISTS idx_pm_tarefas_criado_por ON public.pm_tarefas (criado_por);
