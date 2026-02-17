-- Migration: Adicionar permissões do recurso comunica_cnj
-- Data: 2025-12-29
-- Descrição: Adiciona 6 permissões do recurso comunica_cnj para corrigir erro de "Permissão negada"

-- Inserir permissões disponíveis para o recurso comunica_cnj (se não existirem)
-- Estas permissões estarão disponíveis para atribuição aos usuários

DO $$
BEGIN
  -- Verifica se a coluna recurso existe na tabela permissoes_disponiveis
  -- Se não existir, as permissões devem ser gerenciadas pela aplicação via MATRIZ_PERMISSOES

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'permissoes_disponiveis'
  ) THEN
    -- Inserir permissões disponíveis
    INSERT INTO permissoes_disponiveis (recurso, operacao, descricao)
    VALUES
      ('comunica_cnj', 'listar', 'Listar comunicações capturadas do CNJ'),
      ('comunica_cnj', 'visualizar', 'Visualizar detalhes de comunicação do CNJ'),
      ('comunica_cnj', 'consultar', 'Consultar comunicações na API do CNJ'),
      ('comunica_cnj', 'capturar', 'Capturar e sincronizar comunicações do CNJ'),
      ('comunica_cnj', 'editar', 'Editar e vincular comunicações do CNJ'),
      ('comunica_cnj', 'exportar', 'Exportar comunicações do CNJ')
    ON CONFLICT (recurso, operacao) DO NOTHING;

    RAISE NOTICE 'Permissões do comunica_cnj adicionadas à tabela permissoes_disponiveis';
  ELSE
    RAISE NOTICE 'Tabela permissoes_disponiveis não existe. Permissões gerenciadas via MATRIZ_PERMISSOES no código.';
  END IF;

  -- Conceder permissões aos super admins (se a coluna is_super_admin existir)
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'usuarios'
    AND column_name = 'is_super_admin'
  ) THEN
    -- Inserir permissões para todos os super admins
    INSERT INTO permissoes (usuario_id, recurso, operacao, permitido)
    SELECT
      u.id,
      perm.recurso,
      perm.operacao,
      true
    FROM usuarios u
    CROSS JOIN (
      VALUES
        ('comunica_cnj', 'listar'),
        ('comunica_cnj', 'visualizar'),
        ('comunica_cnj', 'consultar'),
        ('comunica_cnj', 'capturar'),
        ('comunica_cnj', 'editar'),
        ('comunica_cnj', 'exportar')
    ) AS perm(recurso, operacao)
    WHERE u.is_super_admin = true
    ON CONFLICT (usuario_id, recurso, operacao) DO UPDATE
      SET permitido = true;

    RAISE NOTICE 'Permissões do comunica_cnj concedidas aos super admins';
  END IF;
END $$;
