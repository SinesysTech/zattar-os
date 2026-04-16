-- ============================================================================
-- Migration: Limpeza retroativa de atribuições a usuários inativos
-- ============================================================================
-- Data: 2026-04-09 (aplicada em 2026-04-16 após fix do trigger de atribuição)
--
-- Problema: O trigger desativar_usuario_auto_desatribuir só executa quando um
--           usuário é desativado APÓS o trigger existir. Itens já atribuídos
--           a usuários desativados antes da criação do trigger permaneceram
--           com responsavel_id apontando para usuários inativos.
--
-- Solução: One-shot cleanup que limpa todas as atribuições órfãs.
--
-- RESILIÊNCIA: Cada UPDATE é envolvido em DO block com IF EXISTS para tolerar
--              estados onde alguma tabela ainda não foi criada (ex: shadow DB
--              do CI ou ambientes intermediários).
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='acervo') THEN
    UPDATE public.acervo SET responsavel_id = NULL WHERE responsavel_id IN (SELECT id FROM public.usuarios WHERE ativo = false);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='audiencias') THEN
    UPDATE public.audiencias SET responsavel_id = NULL WHERE responsavel_id IN (SELECT id FROM public.usuarios WHERE ativo = false);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='expedientes_manuais') THEN
    UPDATE public.expedientes_manuais SET responsavel_id = NULL WHERE responsavel_id IN (SELECT id FROM public.usuarios WHERE ativo = false);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='contratos') THEN
    UPDATE public.contratos SET responsavel_id = NULL WHERE responsavel_id IN (SELECT id FROM public.usuarios WHERE ativo = false);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='pendentes_manifestacao') THEN
    UPDATE public.pendentes_manifestacao SET responsavel_id = NULL WHERE responsavel_id IN (SELECT id FROM public.usuarios WHERE ativo = false);
  END IF;
END $$;
