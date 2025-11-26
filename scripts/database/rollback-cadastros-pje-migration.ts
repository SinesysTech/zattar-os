#!/usr/bin/env tsx

/**
 * Script de rollback da migração de cadastros_pje
 * 
 * Reverte a migração da nova arquitetura onde id_pessoa_pje foi movido para cadastros_pje
 * e representantes foram deduplicados por CPF.
 * 
 * ATENÇÃO: Este script é DESTRUTIVO e só deve ser usado em caso de problemas graves
 * na migração. Sempre teste em ambiente de desenvolvimento primeiro e faça backups.
 * 
 * Uso: npx tsx scripts/database/rollback-cadastros-pje-migration.ts --confirm
 */

import { Pool } from 'pg';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

// Configurar pool de conexão PostgreSQL
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// ============================================================================
// Funções Utilitárias
// ============================================================================

/**
 * Executa uma query SQL e loga o resultado
 */
async function executeSQL(sql: string, description: string): Promise<void> {
  console.log(`⏳ ${description}...`);
  const startTime = Date.now();
  
  try {
    await pool.query(sql);
    const duration = Date.now() - startTime;
    console.log(`✅ ${description} - OK (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ ${description} - ERRO (${duration}ms):`, error);
    throw error;
  }
}

/**
 * Executa múltiplas queries SQL em sequência
 */
async function executeMultipleSQL(queries: Array<{ sql: string; description: string }>): Promise<void> {
  for (const { sql, description } of queries) {
    await executeSQL(sql, description);
  }
}

/**
 * Verifica se uma tabela existe
 */
async function tableExists(tableName: string): Promise<boolean> {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = $1
    )
  `, [tableName]);
  return result.rows[0].exists;
}

/**
 * Verifica se uma coluna existe em uma tabela
 */
async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
    )
  `, [tableName, columnName]);
  return result.rows[0].exists;
}

/**
 * Conta registros em uma tabela
 */
async function countRecords(tableName: string): Promise<number> {
  const result = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
  return parseInt(result.rows[0].count);
}

// ============================================================================
// Ações de Rollback
// ============================================================================

/**
 * Restaura a tabela representantes para a estrutura antiga
 */
async function restaurarRepresentantes(): Promise<void> {
  console.log('\n🔄 [1/5] Restaurando tabela representantes...');

  const queries = [
    {
      sql: 'ALTER TABLE representantes RENAME TO representantes_new_backup;',
      description: 'Renomear representantes atuais para backup'
    },
    {
      sql: 'ALTER TABLE representantes_old RENAME TO representantes;',
      description: 'Restaurar tabela representantes antiga'
    }
  ];

  await executeMultipleSQL(queries);

  // Verificar se índices existem e recriar se necessário
  const indexQueries = [
    {
      sql: 'CREATE INDEX IF NOT EXISTS idx_representantes_oab ON representantes(numero_oab);',
      description: 'Recriar índice OAB'
    },
    {
      sql: 'CREATE INDEX IF NOT EXISTS idx_representantes_parte ON representantes(parte_tipo, parte_id);',
      description: 'Recriar índice parte'
    },
    {
      sql: 'CREATE INDEX IF NOT EXISTS idx_representantes_processo ON representantes(trt, grau, numero_processo);',
      description: 'Recriar índice processo'
    },
    {
      sql: 'CREATE INDEX IF NOT EXISTS idx_representantes_id_pessoa_pje ON representantes(id_pessoa_pje);',
      description: 'Recriar índice id_pessoa_pje'
    }
  ];

  await executeMultipleSQL(indexQueries);

  // Recriar constraint único se necessário
  await executeSQL(`
    ALTER TABLE representantes 
    ADD CONSTRAINT IF NOT EXISTS uq_representantes_por_processo 
    UNIQUE (parte_tipo, parte_id, trt, grau, numero_processo, id_pessoa_pje);
  `, 'Recriar constraint único de representantes por processo');

  // Recriar políticas RLS (assumindo que existem)
  const rlsQueries = [
    {
      sql: 'ALTER TABLE representantes ENABLE ROW LEVEL SECURITY;',
      description: 'Habilitar RLS'
    },
    {
      sql: `
        CREATE POLICY IF NOT EXISTS "Enable read access for authenticated users" ON representantes
        FOR SELECT USING (auth.role() = 'authenticated');
      `,
      description: 'Recriar política RLS de leitura'
    },
    {
      sql: `
        CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users" ON representantes
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
      `,
      description: 'Recriar política RLS de inserção'
    },
    {
      sql: `
        CREATE POLICY IF NOT EXISTS "Enable update for authenticated users" ON representantes
        FOR UPDATE USING (auth.role() = 'authenticated');
      `,
      description: 'Recriar política RLS de atualização'
    }
  ];

  await executeMultipleSQL(rlsQueries);

  console.log('✅ Tabela representantes restaurada com sucesso');
}

/**
 * Reverte as atualizações de IDs em processo_partes
 */
async function restaurarProcessoPartes(): Promise<void> {
  console.log('\n🔄 [2/5] Restaurando vínculos em processo_partes...');

  // Verificar se tabela de mapeamento existe
  const mappingExists = await tableExists('representantes_old_to_new_id');
  
  if (!mappingExists) {
    console.log('⚠️  Tabela de mapeamento representantes_old_to_new_id não encontrada. Pulando restauração de processo_partes.');
    return;
  }

  await executeSQL(`
    UPDATE processo_partes 
    SET representante_id = m.old_id
    FROM representantes_old_to_new_id m
    WHERE processo_partes.representante_id = m.new_id;
  `, 'Reverter IDs de representantes em processo_partes usando tabela de mapeamento');

  // Limpar tabela de mapeamento
  await executeSQL('DROP TABLE representantes_old_to_new_id;', 'Remover tabela de mapeamento temporária');

  console.log('✅ Vínculos em processo_partes restaurados');
}

/**
 * Re-adiciona colunas id_pessoa_pje nas tabelas de entidades
 */
async function restaurarColunasIdPessoaPje(): Promise<void> {
  console.log('\n🔄 [3/5] Restaurando colunas id_pessoa_pje...');

  const tables = ['clientes', 'partes_contrarias', 'terceiros'];

  for (const table of tables) {
    const columnExistsAlready = await columnExists(table, 'id_pessoa_pje');
    
    if (!columnExistsAlready) {
      await executeSQL(`
        ALTER TABLE ${table} ADD COLUMN id_pessoa_pje bigint;
      `, `Adicionar coluna id_pessoa_pje em ${table}`);
    } else {
      console.log(`⚠️  Coluna id_pessoa_pje já existe em ${table}`);
    }
  }

  // Popular colunas usando dados de cadastros_pje (se ainda existir)
  const cadastrosExists = await tableExists('cadastros_pje');
  
  if (cadastrosExists) {
    // Para clientes - inferir tribunal se possível
    await executeSQL(`
      UPDATE clientes 
      SET id_pessoa_pje = cp.id_pessoa_pje
      FROM cadastros_pje cp
      WHERE cp.tipo_entidade = 'cliente' 
        AND cp.entidade_id = clientes.id
        AND cp.tribunal = (
          SELECT pp.trt 
          FROM processo_partes pp 
          WHERE pp.parte_tipo = 'cliente' AND pp.parte_id = clientes.id 
          LIMIT 1
        );
    `, 'Popular id_pessoa_pje em clientes usando cadastros_pje');

    // Para partes_contrarias
    await executeSQL(`
      UPDATE partes_contrarias 
      SET id_pessoa_pje = cp.id_pessoa_pje
      FROM cadastros_pje cp
      WHERE cp.tipo_entidade = 'parte_contraria' 
        AND cp.entidade_id = partes_contrarias.id
        AND cp.tribunal = (
          SELECT pp.trt 
          FROM processo_partes pp 
          WHERE pp.parte_tipo = 'parte_contraria' AND pp.parte_id = partes_contrarias.id 
          LIMIT 1
        );
    `, 'Popular id_pessoa_pje em partes_contrarias usando cadastros_pje');

    // Para terceiros
    await executeSQL(`
      UPDATE terceiros 
      SET id_pessoa_pje = cp.id_pessoa_pje
      FROM cadastros_pje cp
      WHERE cp.tipo_entidade = 'terceiro' 
        AND cp.entidade_id = terceiros.id;
    `, 'Popular id_pessoa_pje em terceiros usando cadastros_pje');
  } else {
    console.log('⚠️  Tabela cadastros_pje não encontrada. Colunas id_pessoa_pje ficarão vazias.');
  }

  // Recriar índices em id_pessoa_pje
  const indexQueries = [
    {
      sql: 'CREATE INDEX IF NOT EXISTS idx_clientes_id_pessoa_pje ON clientes(id_pessoa_pje);',
      description: 'Recriar índice id_pessoa_pje em clientes'
    },
    {
      sql: 'CREATE INDEX IF NOT EXISTS idx_partes_contrarias_id_pessoa_pje ON partes_contrarias(id_pessoa_pje);',
      description: 'Recriar índice id_pessoa_pje em partes_contrarias'
    },
    {
      sql: 'CREATE INDEX IF NOT EXISTS idx_terceiros_id_pessoa_pje ON terceiros(id_pessoa_pje);',
      description: 'Recriar índice id_pessoa_pje em terceiros'
    }
  ];

  await executeMultipleSQL(indexQueries);

  console.log('✅ Colunas id_pessoa_pje restauradas');
}

/**
 * Remove constraints UNIQUE em CPF/CNPJ
 */
async function removerConstraintsUnicos(): Promise<void> {
  console.log('\n🔄 [4/5] Removendo constraints únicos em CPF/CNPJ...');

  const constraintQueries = [
    {
      sql: 'ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_cpf_unique;',
      description: 'Remover constraint único CPF em clientes'
    },
    {
      sql: 'ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_cnpj_unique;',
      description: 'Remover constraint único CNPJ em clientes'
    },
    {
      sql: 'ALTER TABLE partes_contrarias DROP CONSTRAINT IF EXISTS partes_contrarias_cpf_unique;',
      description: 'Remover constraint único CPF em partes_contrarias'
    },
    {
      sql: 'ALTER TABLE partes_contrarias DROP CONSTRAINT IF EXISTS partes_contrarias_cnpj_unique;',
      description: 'Remover constraint único CNPJ em partes_contrarias'
    },
    {
      sql: 'ALTER TABLE terceiros DROP CONSTRAINT IF EXISTS terceiros_cpf_unique;',
      description: 'Remover constraint único CPF em terceiros'
    },
    {
      sql: 'ALTER TABLE terceiros DROP CONSTRAINT IF EXISTS terceiros_cnpj_unique;',
      description: 'Remover constraint único CNPJ em terceiros'
    },
    {
      sql: 'ALTER TABLE representantes DROP CONSTRAINT IF EXISTS representantes_cpf_unique;',
      description: 'Remover constraint único CPF em representantes'
    }
  ];

  await executeMultipleSQL(constraintQueries);

  console.log('✅ Constraints únicos removidos');
}

/**
 * Limpa tabela cadastros_pje
 */
async function limparCadastrosPje(): Promise<void> {
  console.log('\n🔄 [5/5] Limpando tabela cadastros_pje...');

  const exists = await tableExists('cadastros_pje');
  
  if (exists) {
    // Contar registros antes de dropar
    const count = await countRecords('cadastros_pje');
    console.log(`📊 Tabela cadastros_pje contém ${count} registros`);

    await executeSQL('DROP TABLE cadastros_pje;', 'Dropar tabela cadastros_pje');
  } else {
    console.log('⚠️  Tabela cadastros_pje não existe ou já foi removida');
  }

  console.log('✅ Tabela cadastros_pje limpa');
}

// ============================================================================
// Validações Pós-Rollback
// ============================================================================

/**
 * Executa validações básicas após o rollback
 */
async function validarRollback(): Promise<void> {
  console.log('\n🔍 VALIDANDO ROLLBACK...');

  const validations = [
    {
      name: 'Tabela representantes restaurada',
      check: async () => {
        const exists = await tableExists('representantes');
        const hasOldColumns = await columnExists('representantes', 'trt') && 
                             await columnExists('representantes', 'grau') && 
                             await columnExists('representantes', 'numero_processo');
        return exists && hasOldColumns;
      }
    },
    {
      name: 'Colunas id_pessoa_pje restauradas',
      check: async () => {
        const tables = ['clientes', 'partes_contrarias', 'terceiros'];
        for (const table of tables) {
          if (!(await columnExists(table, 'id_pessoa_pje'))) return false;
        }
        return true;
      }
    },
    {
      name: 'Constraints únicos removidos',
      check: async () => {
        // Verificar se não existem constraints com nome contendo 'cpf' ou 'cnpj'
        const result = await pool.query(`
          SELECT constraint_name 
          FROM information_schema.table_constraints 
          WHERE table_schema = 'public' 
            AND constraint_type = 'UNIQUE' 
            AND (constraint_name LIKE '%cpf%' OR constraint_name LIKE '%cnpj%')
        `);
        return result.rows.length === 0;
      }
    },
    {
      name: 'Tabela cadastros_pje removida',
      check: async () => !(await tableExists('cadastros_pje'))
    }
  ];

  let allPassed = true;

  for (const validation of validations) {
    try {
      const passed = await validation.check();
      const status = passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${validation.name}`);
      if (!passed) allPassed = false;
    } catch (error) {
      console.log(`❌ FAIL ${validation.name} - Erro: ${error}`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('\n🎉 ROLLBACK VALIDADO COM SUCESSO!');
  } else {
    console.log('\n⚠️  PROBLEMAS ENCONTRADOS NO ROLLBACK!');
    console.log('Verifique os logs acima e corrija manualmente se necessário.');
  }

  return allPassed;
}

// ============================================================================
// Função Principal
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (!args.includes('--confirm')) {
    console.log('❌ ROLLBACK NÃO AUTORIZADO');
    console.log('');
    console.log('Este script reverte mudanças DESTRUTIVAS na estrutura do banco de dados.');
    console.log('Só execute em caso de problemas graves na migração.');
    console.log('');
    console.log('📋 PRÉ-REQUISITOS:');
    console.log('  - Backup completo do banco de dados');
    console.log('  - Teste em ambiente de desenvolvimento');
    console.log('  - Confirmação de que a migração falhou');
    console.log('');
    console.log('🚨 PARA EXECUTAR:');
    console.log('  npx tsx scripts/database/rollback-cadastros-pje-migration.ts --confirm');
    process.exit(1);
  }

  console.log('🚨 INICIANDO ROLLBACK DA MIGRAÇÃO CADASTROS_PJE 🚨');
  console.log('=' .repeat(60));
  console.log('Este processo irá:');
  console.log('  1. Restaurar tabela representantes para estrutura antiga');
  console.log('  2. Reverter vínculos em processo_partes');
  console.log('  3. Re-adicionar colunas id_pessoa_pje');
  console.log('  4. Remover constraints únicos em CPF/CNPJ');
  console.log('  5. Remover tabela cadastros_pje');
  console.log('');
  console.log('⚠️  CERTIFIQUE-SE DE TER BACKUPS ANTES DE PROSSEGUIR!');
  console.log('=' .repeat(60));
  console.log('');

  try {
    // Executar ações de rollback em ordem
    await restaurarRepresentantes();
    await restaurarProcessoPartes();
    await restaurarColunasIdPessoaPje();
    await removerConstraintsUnicos();
    await limparCadastrosPje();

    // Validar rollback
    const validationPassed = await validarRollback();

    console.log('');
    console.log('=' .repeat(60));
    if (validationPassed) {
      console.log('🎉 ROLLBACK CONCLUÍDO COM SUCESSO!');
      console.log('A estrutura do banco foi restaurada para o estado pré-migração.');
      console.log('Execute queries antigas para verificar se tudo funciona.');
    } else {
      console.log('⚠️  ROLLBACK CONCLUÍDO COM AVISOS!');
      console.log('Verifique os logs acima e valide manualmente.');
    }
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('');
    console.error('❌ ERRO FATAL NO ROLLBACK:');
    console.error(error);
    console.error('');
    console.error('O rollback pode ter sido interrompido parcialmente.');
    console.error('Verifique o estado do banco e execute correções manuais se necessário.');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('Erro não tratado:', error);
    process.exit(1);
  });
}

export { main as rollbackCadastrosPjeMigration };