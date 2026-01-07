/**
 * Script para atualizar telefones dos clientes a partir dos JSONs de processamento
 *
 * Uso:
 *   node update_telefones_from_json.js --dry-run
 *   node update_telefones_from_json.js
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
 * Parseia telefone no formato "(83) 9 9816-6067" ou similar
 * Retorna { ddd, numero } ou null
 */
function parseTelefone(telefone) {
  if (!telefone) return null;

  const tel = String(telefone).trim();
  if (!tel) return null;

  // Remove todos os caracteres não numéricos
  const numeros = tel.replace(/\D/g, '');

  if (numeros.length < 10) return null;

  // DDD são os 2 primeiros dígitos
  const ddd = numeros.slice(0, 2);

  // Número é o resto
  let numero = numeros.slice(2);

  // Formatar número: se tiver 9 dígitos (celular com 9), formata como 9XXXX-XXXX
  // Se tiver 8 dígitos (fixo), formata como XXXX-XXXX
  if (numero.length === 9) {
    numero = `${numero.slice(0, 5)}-${numero.slice(5)}`;
  } else if (numero.length === 8) {
    numero = `${numero.slice(0, 4)}-${numero.slice(4)}`;
  }

  return { ddd, numero };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  log('╔════════════════════════════════════════════════════════════════╗');
  log('║     Atualização de Telefones - JSON → Supabase                 ║');
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
    com_telefone: 0,
    telefone_valido: 0,
    ja_tem_telefone: 0,
    atualizados: 0,
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

        const clienteId = result.supabase?.cliente_id;
        const telefone = result.dados_extraidos?.contratante?.telefone;

        if (!clienteId) continue;
        if (!telefone) continue;

        stats.com_telefone++;

        const parsed = parseTelefone(telefone);
        if (!parsed) {
          log(`   ⚠️ Telefone inválido para cliente ${clienteId}: "${telefone}"`);
          continue;
        }

        stats.telefone_valido++;

        // Verificar se cliente já tem telefone
        const { data: cliente, error: fetchError } = await supabase
          .from('clientes')
          .select('id, nome, ddd_celular, numero_celular')
          .eq('id', clienteId)
          .single();

        if (fetchError || !cliente) {
          log(`   ❌ Cliente ${clienteId} não encontrado`);
          stats.erros++;
          continue;
        }

        // Se já tem telefone, pular
        if (cliente.ddd_celular && cliente.numero_celular) {
          stats.ja_tem_telefone++;
          continue;
        }

        if (dryRun) {
          log(`   [DRY-RUN] Atualizaria cliente ${clienteId}: (${parsed.ddd}) ${parsed.numero}`);
          stats.atualizados++;
        } else {
          // Atualizar telefone
          const { error: updateError } = await supabase
            .from('clientes')
            .update({
              ddd_celular: parsed.ddd,
              numero_celular: parsed.numero
            })
            .eq('id', clienteId);

          if (updateError) {
            log(`   ❌ Erro ao atualizar cliente ${clienteId}: ${updateError.message}`);
            stats.erros++;
          } else {
            stats.atualizados++;
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
  log(`   📊 Total de registros:      ${stats.total_registros}`);
  log(`   📱 Com telefone no JSON:    ${stats.com_telefone}`);
  log(`   ✅ Telefones válidos:       ${stats.telefone_valido}`);
  log(`   ⏭️  Já tinham telefone:      ${stats.ja_tem_telefone}`);
  log(`   🔄 Atualizados:             ${stats.atualizados}`);
  log(`   ❌ Erros:                   ${stats.erros}`);
  log('═══════════════════════════════════════════════════════════════\n');
}

main().catch((e) => {
  log(`❌ Fatal: ${e?.message ?? e}`);
  console.error(e);
  process.exitCode = 1;
});
