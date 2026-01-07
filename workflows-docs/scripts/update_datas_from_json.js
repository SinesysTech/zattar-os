/**
 * Script para atualizar datas dos contratos a partir dos JSONs de processamento
 *
 * Corrige:
 * - contratos.cadastrado_em: deve ser a data de assinatura do contrato
 * - contrato_status_historico.changed_at: deve ser a data de assinatura do contrato
 *
 * Uso:
 *   node update_datas_from_json.js --dry-run
 *   node update_datas_from_json.js
 */

import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

// Obter diretório do projeto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });
dotenv.config({ path: path.join(PROJECT_ROOT, '.env') });

// ============================================================================
// UTILITÁRIOS
// ============================================================================

function nowIso() {
  return new Date().toISOString();
}

function log(msg) {
  console.log(`${nowIso()} - ${msg}`);
}

function hasFlag(flag) {
  return process.argv.slice(2).some(a => a === flag || a.startsWith(`${flag}=`));
}

/**
 * Mapeamento de meses em português para número (0-11)
 */
const MESES_PT = {
  'janeiro': 0,
  'fevereiro': 1,
  'marco': 2,
  'março': 2,
  'abril': 3,
  'maio': 4,
  'junho': 5,
  'julho': 6,
  'agosto': 7,
  'setembro': 8,
  'outubro': 9,
  'novembro': 10,
  'dezembro': 11
};

/**
 * Parseia data no formato "17 de Março de 2025" ou similar
 * Retorna Date ou null
 */
function parseDataAssinatura(dataStr) {
  if (!dataStr) return null;

  const str = String(dataStr).trim().toLowerCase();
  if (!str) return null;

  // Padrão: "DD de MMMM de YYYY" (usando \p{L} para capturar letras com acento)
  let match = str.match(/^(\d{1,2})\s+de\s+([\p{L}]+)\s+de\s+(\d{4})$/u);

  // Formato alternativo: "DD MMMM YYYY" (sem "de")
  if (!match) {
    match = str.match(/^(\d{1,2})\s+([\p{L}]+)\s+(\d{4})$/u);
  }

  if (!match) {
    // Tentar formato alternativo: "DD/MM/YYYY"
    const altMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (altMatch) {
      const [, dia, mes, ano] = altMatch;
      return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), 12, 0, 0);
    }
    return null;
  }

  const [, dia, mesNome, ano] = match;
  const mes = MESES_PT[mesNome];

  if (mes === undefined) {
    return null;
  }

  // Criar data ao meio-dia para evitar problemas de timezone
  return new Date(parseInt(ano), mes, parseInt(dia), 12, 0, 0);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  log('╔════════════════════════════════════════════════════════════════╗');
  log('║     Atualização de Datas - JSON → Supabase                     ║');
  log('╚════════════════════════════════════════════════════════════════╝\n');

  const dryRun = hasFlag('--dry-run');
  if (dryRun) log('🔍 MODO DRY-RUN: Nenhuma alteração será feita\n');

  // Configurar Supabase
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    ?? process.env.SUPABASE_SECRET_KEY
    ?? process.env.SUPABASE_ANON_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log('❌ Supabase não configurado');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  log(`✅ Supabase configurado: ${supabaseUrl}\n`);

  // Listar diretórios de output
  const outputDir = path.join(PROJECT_ROOT, 'workflows-docs', 'output', 'contracts');
  const dirs = await fs.readdir(outputDir);
  const jsonDirs = dirs.filter(d => d.startsWith('2026-')).sort();

  log(`📁 Diretórios encontrados: ${jsonDirs.length}`);

  // Estatísticas
  const stats = {
    total_registros: 0,
    com_contrato_id: 0,
    com_data_assinatura: 0,
    data_valida: 0,
    contratos_atualizados: 0,
    historico_atualizados: 0,
    erros: 0
  };

  // Processar cada diretório
  for (const dir of jsonDirs) {
    const jsonPath = path.join(outputDir, dir, 'results.json');

    try {
      const content = await fs.readFile(jsonPath, 'utf8');
      const data = JSON.parse(content);

      log(`\n📄 Processando: ${dir}`);
      log(`   Registros: ${data.results?.length ?? 0}`);

      if (!data.results) continue;

      for (const result of data.results) {
        stats.total_registros++;

        if (result.status !== 'SUCCESS') continue;

        const contratoId = result.supabase?.contrato_id;
        const dataAssinatura = result.dados_extraidos?.data_assinatura;

        if (!contratoId) continue;
        stats.com_contrato_id++;

        if (!dataAssinatura) continue;
        stats.com_data_assinatura++;

        const parsedDate = parseDataAssinatura(dataAssinatura);
        if (!parsedDate) {
          log(`   ⚠️ Data inválida para contrato ${contratoId}: "${dataAssinatura}"`);
          continue;
        }

        stats.data_valida++;

        const dataIso = parsedDate.toISOString();

        if (dryRun) {
          log(`   [DRY-RUN] Contrato ${contratoId}: cadastrado_em → ${dataIso.split('T')[0]} (${dataAssinatura})`);
          stats.contratos_atualizados++;
        } else {
          // Atualizar contrato.cadastrado_em
          const { error: contratoError } = await supabase
            .from('contratos')
            .update({ cadastrado_em: dataIso })
            .eq('id', contratoId);

          if (contratoError) {
            log(`   ❌ Erro ao atualizar contrato ${contratoId}: ${contratoError.message}`);
            stats.erros++;
          } else {
            stats.contratos_atualizados++;
          }

          // Atualizar contrato_status_historico.changed_at
          const { error: historicoError, count } = await supabase
            .from('contrato_status_historico')
            .update({ changed_at: dataIso })
            .eq('contrato_id', contratoId);

          if (historicoError) {
            log(`   ❌ Erro ao atualizar histórico do contrato ${contratoId}: ${historicoError.message}`);
            stats.erros++;
          } else {
            stats.historico_atualizados++;
          }
        }
      }
    } catch (e) {
      log(`   ❌ Erro ao processar ${dir}: ${e.message}`);
    }
  }

  // Resumo final
  log('\n═══════════════════════════════════════════════════════════════');
  log('                        RESUMO FINAL');
  log('═══════════════════════════════════════════════════════════════');
  log(`   📊 Total de registros:       ${stats.total_registros}`);
  log(`   📝 Com contrato_id:          ${stats.com_contrato_id}`);
  log(`   📅 Com data_assinatura:      ${stats.com_data_assinatura}`);
  log(`   ✅ Datas válidas:            ${stats.data_valida}`);
  log(`   🔄 Contratos atualizados:    ${stats.contratos_atualizados}`);
  log(`   🔄 Históricos atualizados:   ${stats.historico_atualizados}`);
  log(`   ❌ Erros:                    ${stats.erros}`);
  log('═══════════════════════════════════════════════════════════════\n');
}

main().catch((e) => {
  log(`❌ Fatal: ${e?.message ?? e}`);
  console.error(e);
  process.exitCode = 1;
});
