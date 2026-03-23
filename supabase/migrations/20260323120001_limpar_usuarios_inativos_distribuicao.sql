-- ============================================================================
-- LIMPEZA: Remover usuários inativos de config_regioes_atribuicao
-- ============================================================================
-- Data: 2026-03-23
-- Objetivo: Limpar IDs de usuários inativos que permaneceram em
--           responsaveis_ids após desativação (antes do fix do trigger)
-- ============================================================================

DO $$
DECLARE
  v_regiao record;
  v_usuario_id bigint;
  v_usuario_nome text;
  v_removidos text[] := ARRAY[]::text[];
BEGIN
  FOR v_regiao IN SELECT id, nome, responsaveis_ids FROM config_regioes_atribuicao LOOP
    FOREACH v_usuario_id IN ARRAY v_regiao.responsaveis_ids LOOP
      -- Verificar se o usuário está inativo
      SELECT nome_exibicao INTO v_usuario_nome
      FROM usuarios
      WHERE id = v_usuario_id AND ativo = false;

      IF FOUND THEN
        -- Remover da lista
        UPDATE config_regioes_atribuicao
        SET responsaveis_ids = array_remove(responsaveis_ids, v_usuario_id)
        WHERE id = v_regiao.id;

        v_removidos := array_append(v_removidos,
          format('%s (ID %s) removido da região "%s"', v_usuario_nome, v_usuario_id, v_regiao.nome));
      END IF;
    END LOOP;
  END LOOP;

  IF array_length(v_removidos, 1) > 0 THEN
    RAISE NOTICE 'Usuários inativos removidos da distribuição: %', array_to_string(v_removidos, '; ');
  ELSE
    RAISE NOTICE 'Nenhum usuário inativo encontrado nas regiões de distribuição.';
  END IF;
END $$;
