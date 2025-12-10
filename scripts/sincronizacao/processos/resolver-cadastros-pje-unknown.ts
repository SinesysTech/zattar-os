#!/usr/bin/env tsx
/**
 * Script para Resolver Registros UNKNOWN em cadastros_pje
 *
 * PROPÓSITO:
 * Resolve registros na tabela cadastros_pje que foram migrados com tribunal='UNKNOWN'
 * durante a migração inicial. Usa a tabela processo_partes para inferir o tribunal
 * correto baseado nos vínculos existentes.
 *
 * ESTRATÉGIA:
 * 1. Busca registros em cadastros_pje onde tribunal = 'UNKNOWN'
 * 2. Para cada registro, busca em processo_partes os TRTs onde a entidade aparece
 * 3. Seleciona o TRT mais frequente (priorizando TRT sobre TST)
 * 4. Atualiza o registro com o tribunal e grau inferidos
 *
 * COMO USAR:
 * npx tsx scripts/sincronizacao/resolver-cadastros-pje-unknown.ts [--dry-run] [--limit N]
 *
 * OPÇÕES:
 * --dry-run    Simula a execução sem persistir (padrão: false)
 * --limit N    Limita a quantidade de registros a processar (padrão: sem limite)
 * --verbose    Exibe logs detalhados
 *
 * EXEMPLOS:
 * npx tsx scripts/sincronizacao/resolver-cadastros-pje-unknown.ts --dry-run
 * npx tsx scripts/sincronizacao/resolver-cadastros-pje-unknown.ts --limit 100
 * npx tsx scripts/sincronizacao/resolver-cadastros-pje-unknown.ts --verbose
 */

// Carregar variáveis de ambiente
import { config } from 'dotenv';
import { resolve } from 'path';

// Tentar carregar .env.local primeiro, depois .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { createServiceClient } from '@/backend/utils/supabase/service-client';

// ============================================================================
// TIPOS
// ============================================================================

interface CadastroPJEUnknown {
  id: number;
  tipo_entidade: string;
  entidade_id: number;
  id_pessoa_pje: number;
}

interface TribunalFrequencia {
  trt: string;
  grau: string;
  qtd: number;
}

interface ResultadoProcessamento {
  cadastro_id: number;
  tipo_entidade: string;
  entidade_id: number;
  tribunal_anterior: string;
  tribunal_novo: string | null;
  grau_novo: string | null;
  status: 'atualizado' | 'sem_vinculo' | 'erro';
  erro?: string;
}

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');
const limitIndex = args.indexOf('--limit');
const LIMIT = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : null;

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function log(message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

function logVerbose(message: string, data?: unknown) {
  if (VERBOSE) {
    log(message, data);
  }
}

/**
 * Busca registros em cadastros_pje com tribunal = 'UNKNOWN'
 */
async function buscarRegistrosUnknown(limit?: number | null): Promise<CadastroPJEUnknown[]> {
  const supabase = createServiceClient();

  let query = supabase
    .from('cadastros_pje')
    .select('id, tipo_entidade, entidade_id, id_pessoa_pje')
    .eq('tribunal', 'UNKNOWN')
    .order('id');

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar registros UNKNOWN: ${error.message}`);
  }

  return data || [];
}

/**
 * Busca os tribunais onde uma entidade aparece em processo_partes
 * Retorna ordenado por frequência (mais processos primeiro)
 */
async function buscarTribunaisEntidade(
  tipoEntidade: string,
  entidadeId: number
): Promise<TribunalFrequencia[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc('get_tribunais_entidade', {
    p_tipo_entidade: tipoEntidade,
    p_entidade_id: entidadeId,
  });

  if (error) {
    // Se a função RPC não existir, usar query direta
    if (error.code === 'PGRST202') {
      return buscarTribunaisEntidadeDireto(tipoEntidade, entidadeId);
    }
    throw new Error(`Erro ao buscar tribunais da entidade: ${error.message}`);
  }

  return data || [];
}

/**
 * Busca tribunais diretamente via SQL (fallback se RPC não existir)
 */
async function buscarTribunaisEntidadeDireto(
  tipoEntidade: string,
  entidadeId: number
): Promise<TribunalFrequencia[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('processo_partes')
    .select('trt, grau')
    .eq('tipo_entidade', tipoEntidade)
    .eq('entidade_id', entidadeId);

  if (error) {
    throw new Error(`Erro ao buscar tribunais da entidade: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Agregar manualmente
  const frequencias: Record<string, TribunalFrequencia> = {};

  for (const row of data) {
    const key = `${row.trt}|${row.grau}`;
    if (!frequencias[key]) {
      frequencias[key] = { trt: row.trt, grau: row.grau, qtd: 0 };
    }
    frequencias[key].qtd++;
  }

  // Ordenar por quantidade (decrescente)
  return Object.values(frequencias).sort((a, b) => b.qtd - a.qtd);
}

/**
 * Seleciona o melhor tribunal para atribuir ao registro UNKNOWN
 * Prioriza TRTs sobre TST (TST geralmente é recurso de outro TRT)
 */
function selecionarMelhorTribunal(tribunais: TribunalFrequencia[]): TribunalFrequencia | null {
  if (tribunais.length === 0) {
    return null;
  }

  // Separar TRTs e TST
  const trts = tribunais.filter(t => t.trt !== 'TST');
  const tsts = tribunais.filter(t => t.trt === 'TST');

  // Se tem TRT, usar o mais frequente
  if (trts.length > 0) {
    // Priorizar primeiro_grau sobre segundo_grau
    const primeiroGrau = trts.filter(t => t.grau === 'primeiro_grau');
    if (primeiroGrau.length > 0) {
      return primeiroGrau[0];
    }
    return trts[0];
  }

  // Se só tem TST, usar ele
  if (tsts.length > 0) {
    return tsts[0];
  }

  return null;
}

/**
 * Atualiza um registro em cadastros_pje com o tribunal correto
 */
async function atualizarCadastroPJE(
  id: number,
  tribunal: string,
  grau: string
): Promise<void> {
  if (DRY_RUN) {
    logVerbose(`[DRY-RUN] Atualizaria cadastro ${id}: tribunal=${tribunal}, grau=${grau}`);
    return;
  }

  const supabase = createServiceClient();

  const { error } = await supabase
    .from('cadastros_pje')
    .update({ tribunal, grau, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw new Error(`Erro ao atualizar cadastro ${id}: ${error.message}`);
  }
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function main() {
  log('='.repeat(80));
  log('SCRIPT: Resolver Registros UNKNOWN em cadastros_pje');
  log('='.repeat(80));

  if (DRY_RUN) {
    log('⚠️  MODO DRY-RUN: Nenhuma alteração será persistida');
  }

  if (LIMIT) {
    log(`📊 Limite de registros: ${LIMIT}`);
  }

  // 1. Buscar registros UNKNOWN
  log('\n📥 Buscando registros com tribunal=UNKNOWN...');
  const registrosUnknown = await buscarRegistrosUnknown(LIMIT);
  log(`   Encontrados: ${registrosUnknown.length} registros`);

  if (registrosUnknown.length === 0) {
    log('\n✅ Nenhum registro UNKNOWN encontrado. Nada a fazer!');
    return;
  }

  // 2. Processar cada registro
  log('\n🔄 Processando registros...');
  const resultados: ResultadoProcessamento[] = [];
  let atualizados = 0;
  let semVinculo = 0;
  let erros = 0;

  for (let i = 0; i < registrosUnknown.length; i++) {
    const registro = registrosUnknown[i];
    const progresso = `[${i + 1}/${registrosUnknown.length}]`;

    try {
      // Buscar tribunais onde a entidade aparece
      const tribunais = await buscarTribunaisEntidade(
        registro.tipo_entidade,
        registro.entidade_id
      );

      if (tribunais.length === 0) {
        logVerbose(`${progresso} Cadastro ${registro.id}: sem vínculos em processo_partes`);
        resultados.push({
          cadastro_id: registro.id,
          tipo_entidade: registro.tipo_entidade,
          entidade_id: registro.entidade_id,
          tribunal_anterior: 'UNKNOWN',
          tribunal_novo: null,
          grau_novo: null,
          status: 'sem_vinculo',
        });
        semVinculo++;
        continue;
      }

      // Selecionar melhor tribunal
      const melhorTribunal = selecionarMelhorTribunal(tribunais);

      if (!melhorTribunal) {
        logVerbose(`${progresso} Cadastro ${registro.id}: não foi possível determinar tribunal`);
        resultados.push({
          cadastro_id: registro.id,
          tipo_entidade: registro.tipo_entidade,
          entidade_id: registro.entidade_id,
          tribunal_anterior: 'UNKNOWN',
          tribunal_novo: null,
          grau_novo: null,
          status: 'sem_vinculo',
        });
        semVinculo++;
        continue;
      }

      // Atualizar registro
      await atualizarCadastroPJE(registro.id, melhorTribunal.trt, melhorTribunal.grau);

      logVerbose(
        `${progresso} Cadastro ${registro.id}: UNKNOWN -> ${melhorTribunal.trt}/${melhorTribunal.grau}`
      );

      resultados.push({
        cadastro_id: registro.id,
        tipo_entidade: registro.tipo_entidade,
        entidade_id: registro.entidade_id,
        tribunal_anterior: 'UNKNOWN',
        tribunal_novo: melhorTribunal.trt,
        grau_novo: melhorTribunal.grau,
        status: 'atualizado',
      });
      atualizados++;

      // Log de progresso a cada 100 registros
      if ((i + 1) % 100 === 0) {
        log(`   Processados: ${i + 1}/${registrosUnknown.length}`);
      }
    } catch (error) {
      const erro = error instanceof Error ? error.message : String(error);
      logVerbose(`${progresso} Cadastro ${registro.id}: ERRO - ${erro}`);
      resultados.push({
        cadastro_id: registro.id,
        tipo_entidade: registro.tipo_entidade,
        entidade_id: registro.entidade_id,
        tribunal_anterior: 'UNKNOWN',
        tribunal_novo: null,
        grau_novo: null,
        status: 'erro',
        erro,
      });
      erros++;
    }
  }

  // 3. Resumo final
  log('\n' + '='.repeat(80));
  log('RESUMO');
  log('='.repeat(80));
  log(`Total processado:    ${registrosUnknown.length}`);
  log(`Atualizados:         ${atualizados} ✅`);
  log(`Sem vínculo:         ${semVinculo} ⚠️`);
  log(`Erros:               ${erros} ❌`);

  if (DRY_RUN) {
    log('\n⚠️  MODO DRY-RUN: Nenhuma alteração foi persistida');
    log('   Execute sem --dry-run para aplicar as alterações');
  }

  // 4. Mostrar distribuição por tribunal (se verbose)
  if (VERBOSE && atualizados > 0) {
    const distribuicao: Record<string, number> = {};
    for (const r of resultados) {
      if (r.status === 'atualizado' && r.tribunal_novo) {
        const key = `${r.tribunal_novo}/${r.grau_novo}`;
        distribuicao[key] = (distribuicao[key] || 0) + 1;
      }
    }

    log('\n📊 Distribuição por tribunal:');
    for (const [key, count] of Object.entries(distribuicao).sort((a, b) => b[1] - a[1])) {
      log(`   ${key}: ${count}`);
    }
  }

  // 5. Mostrar erros (se houver)
  if (erros > 0) {
    log('\n❌ Erros encontrados:');
    for (const r of resultados.filter(r => r.status === 'erro')) {
      log(`   Cadastro ${r.cadastro_id}: ${r.erro}`);
    }
  }

  log('\n' + '='.repeat(80));
  log('FIM');
  log('='.repeat(80));
}

// Executar
main().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
