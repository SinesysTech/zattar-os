#!/usr/bin/env tsx
/**
 * Script de Sincronização de Dados de Capa de Processos
 *
 * PROPÓSITO:
 * Sincroniza os dados de capa (classe_judicial, descricao_orgao_julgador,
 * codigo_status_processo, etc.) de processos que estão com dados incompletos.
 * Busca os dados atualizados diretamente do painel PJE para cada TRT/grau.
 *
 * COMO USAR:
 * npx tsx scripts/sincronizacao/processos/sincronizar-dados-capa.ts [--dry-run] [--verbose]
 *
 * OPÇÕES:
 * --dry-run    Simula a sincronização sem persistir (padrão: false)
 * --verbose    Exibe logs detalhados
 */

// Carregar variáveis de ambiente
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { createServiceClient } from '@/lib/supabase/service-client';
import { autenticarPJE, type AuthResult } from '@/features/captura/services/trt/trt-auth.service';
import { getTribunalConfig } from '@/features/captura/services/trt/config';
import { getCredentialByTribunalAndGrau } from '@/features/captura/credentials/credential.service';
import { buscarProcessosPorIdsNoPainel } from '@/features/captura/services/trt/buscar-processos-painel.service';
import type { CodigoTRT, GrauTRT, Processo } from '@/features/captura';

// ============================================================================
// PROCESSOS ALVO (números dos processos com dados incompletos)
// ============================================================================

const PROCESSOS_ALVO = [
  '0000157-79.2026.5.19.0010',
  '0000086-25.2026.5.17.0013',
  '0000159-32.2026.5.13.0005',
  '0000075-40.2026.5.13.0002',
  '0000121-26.2026.5.13.0003',
  '0000126-79.2026.5.13.0025',
  '0000051-37.2026.5.13.0026',
  '0000122-51.2026.5.13.0022',
  '0000150-70.2026.5.13.0005',
  '0000051-22.2026.5.13.0031',
  '0000140-29.2026.5.13.0004',
  '0000131-83.2026.5.13.0031',
  '0000158-50.2026.5.13.0004',
  '0000056-28.2026.5.13.0004',
  '0000124-09.2026.5.13.0026',
  '0000052-97.2026.5.13.0001',
  '0000130-82.2026.5.13.0004',
  '0000169-87.2026.5.08.0111',
  '0000137-21.2026.5.06.0020',
  '0000080-33.2026.5.05.0019',
  '0100122-04.2026.5.01.0019',
  '0100106-09.2026.5.01.0065',
  '0100105-77.2026.5.01.0015',
  '0100127-77.2026.5.01.0002',
  '0010055-51.2026.5.03.0014',
  '0010110-11.2026.5.03.0108',
  '0010060-46.2026.5.03.0023',
  '0010068-63.2026.5.03.0139',
  '0010130-80.2026.5.03.0179',
  '0010058-82.2026.5.03.0021',
  '0010101-30.2026.5.03.0179',
  '0010058-84.2026.5.03.0182',
  '0010032-59.2026.5.03.0094',
  '0010049-34.2026.5.03.0179',
  '0010127-57.2026.5.03.0137',
  '0010124-83.2026.5.03.0014',
  '0010096-93.2026.5.03.0183',
  '0010089-29.2026.5.03.0013',
  '0010056-24.2026.5.03.0018',
  '0010089-44.2026.5.03.0105',
  '0010057-12.2026.5.03.0114',
];

// ============================================================================
// TIPOS
// ============================================================================

interface RegistroAcervo {
  id: number;
  id_pje: number;
  trt: string;
  grau: string;
  numero_processo: string;
  advogado_id: number;
  origem: string;
  classe_judicial: string | null;
}

interface GrupoTRT {
  trt: CodigoTRT;
  grau: GrauTRT;
  advogadoId: number;
  registros: RegistroAcervo[];
}

interface ConfiguracaoScript {
  dryRun: boolean;
  verbose: boolean;
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

function parseDate(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  try {
    const hasTimezone = /Z|[+-]\d{2}:\d{2}$/.test(dateString);
    if (hasTimezone) return new Date(dateString).toISOString();
    return new Date(dateString + '-03:00').toISOString();
  } catch {
    return null;
  }
}

function parseArgumentos(): ConfiguracaoScript {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
  };
}

// ============================================================================
// FUNÇÕES PRINCIPAIS
// ============================================================================

/**
 * Busca os registros do acervo para os processos alvo
 */
async function buscarRegistrosAlvo(): Promise<RegistroAcervo[]> {
  const supabase = createServiceClient();
  const todos: RegistroAcervo[] = [];

  // Buscar em lotes (Supabase limita a 1000 por query, mas .in() tem limites menores)
  const BATCH_SIZE = 50;
  for (let i = 0; i < PROCESSOS_ALVO.length; i += BATCH_SIZE) {
    const lote = PROCESSOS_ALVO.slice(i, i + BATCH_SIZE);

    const { data, error } = await supabase
      .from('acervo')
      .select('id, id_pje, trt, grau, numero_processo, advogado_id, origem, classe_judicial')
      .in('numero_processo', lote);

    if (error) {
      throw new Error(`Erro ao buscar processos: ${error.message}`);
    }

    if (data) {
      todos.push(...(data as RegistroAcervo[]));
    }
  }

  return todos;
}

/**
 * Agrupa registros por TRT + grau + advogado_id para otimizar autenticações
 */
function agruparPorTRT(registros: RegistroAcervo[]): GrupoTRT[] {
  const mapa = new Map<string, GrupoTRT>();

  for (const reg of registros) {
    const chave = `${reg.trt}|${reg.grau}|${reg.advogado_id}`;

    if (!mapa.has(chave)) {
      mapa.set(chave, {
        trt: reg.trt as CodigoTRT,
        grau: reg.grau as GrauTRT,
        advogadoId: reg.advogado_id,
        registros: [],
      });
    }

    mapa.get(chave)!.registros.push(reg);
  }

  return Array.from(mapa.values());
}

/**
 * Atualiza dados de capa de um registro no acervo
 */
async function atualizarDadosCapa(
  registroId: number,
  processo: Processo,
  dryRun: boolean,
): Promise<boolean> {
  if (dryRun) return true;

  const supabase = createServiceClient();
  const classeJudicial = processo.classeJudicial
    ? processo.classeJudicial.trim()
    : 'Não informada';

  const { error } = await supabase
    .from('acervo')
    .update({
      classe_judicial: classeJudicial,
      descricao_orgao_julgador: processo.descricaoOrgaoJulgador?.trim() || '',
      codigo_status_processo: processo.codigoStatusProcesso?.trim() || '',
      data_autuacao: parseDate(processo.dataAutuacao),
      segredo_justica: processo.segredoDeJustica ?? false,
      prioridade_processual: processo.prioridadeProcessual ?? 0,
      nome_parte_autora: processo.nomeParteAutora?.trim() || '',
      qtde_parte_autora: processo.qtdeParteAutora ?? 1,
      nome_parte_re: processo.nomeParteRe?.trim() || '',
      qtde_parte_re: processo.qtdeParteRe ?? 1,
      juizo_digital: processo.juizoDigital ?? false,
      data_arquivamento: parseDate(processo.dataArquivamento),
      data_proxima_audiencia: parseDate(processo.dataProximaAudiencia),
      tem_associacao: processo.temAssociacao ?? false,
    })
    .eq('id', registroId);

  if (error) {
    console.error(`   ❌ Erro ao atualizar registro ${registroId}: ${error.message}`);
    return false;
  }

  return true;
}

/**
 * Processa um grupo de processos do mesmo TRT/grau/advogado
 */
async function processarGrupo(
  grupo: GrupoTRT,
  config: ConfiguracaoScript,
): Promise<{ atualizados: number; naoEncontrados: number; erros: number }> {
  const resultado = { atualizados: 0, naoEncontrados: 0, erros: 0 };
  let authResult: AuthResult | null = null;

  try {
    // 1. Obter credenciais
    const credencial = await getCredentialByTribunalAndGrau({
      advogadoId: grupo.advogadoId,
      tribunal: grupo.trt,
      grau: grupo.grau,
    });

    if (!credencial) {
      console.error(`   ❌ Sem credencial para ${grupo.trt}/${grupo.grau} (advogado ${grupo.advogadoId})`);
      resultado.erros = grupo.registros.length;
      return resultado;
    }

    // 2. Autenticar no PJE
    console.log(`   🔐 Autenticando no PJE ${grupo.trt}/${grupo.grau}...`);
    const tribunalConfig = await getTribunalConfig(grupo.trt, grupo.grau);
    authResult = await autenticarPJE({
      credential: credencial,
      config: tribunalConfig,
      headless: true,
    });

    const idAdvogado = parseInt(authResult.advogadoInfo.idAdvogado, 10);
    console.log(`   ✅ Autenticado (idAdvogado=${idAdvogado})`);

    // 3. Buscar processos no painel PJE
    const idsPje = grupo.registros.map(r => r.id_pje);
    console.log(`   🔍 Buscando ${idsPje.length} processos no painel PJE...`);

    const { processosPorOrigem, processosFaltantes } = await buscarProcessosPorIdsNoPainel(
      authResult.page,
      { idAdvogado, processosIds: idsPje },
    );

    const todosProcessos = [
      ...processosPorOrigem.acervo_geral,
      ...processosPorOrigem.arquivado,
    ];

    console.log(`   📊 Encontrados: ${todosProcessos.length} | Não encontrados: ${processosFaltantes.length}`);

    // 4. Atualizar cada registro
    for (const registro of grupo.registros) {
      const processoAtualizado = todosProcessos.find(p => p.id === registro.id_pje);

      if (!processoAtualizado) {
        resultado.naoEncontrados++;
        if (config.verbose) {
          console.log(`   ⚠️ Não encontrado no painel: ${registro.numero_processo} (id_pje=${registro.id_pje})`);
        }
        continue;
      }

      const sucesso = await atualizarDadosCapa(registro.id, processoAtualizado, config.dryRun);

      if (sucesso) {
        resultado.atualizados++;
        if (config.verbose) {
          console.log(`   ✅ ${registro.numero_processo}: classe=${processoAtualizado.classeJudicial}, autora=${processoAtualizado.nomeParteAutora?.substring(0, 30)}...`);
        }
      } else {
        resultado.erros++;
      }
    }
  } catch (error) {
    console.error(`   ❌ Erro no grupo ${grupo.trt}/${grupo.grau}:`, error);
    resultado.erros += grupo.registros.length - resultado.atualizados - resultado.naoEncontrados;
  } finally {
    if (authResult?.browser) {
      await authResult.browser.close();
    }
  }

  return resultado;
}

// ============================================================================
// EXECUÇÃO PRINCIPAL
// ============================================================================

async function main() {
  console.log('═'.repeat(80));
  console.log('SINCRONIZAÇÃO DE DADOS DE CAPA DE PROCESSOS');
  console.log('═'.repeat(80));

  const config = parseArgumentos();

  console.log('\n📋 Configuração:');
  console.log(`   • Modo: ${config.dryRun ? 'DRY-RUN (simulação)' : 'EXECUÇÃO REAL'}`);
  console.log(`   • Verbose: ${config.verbose ? 'sim' : 'não'}`);
  console.log(`   • Processos alvo: ${PROCESSOS_ALVO.length}`);

  const inicio = Date.now();
  let totalAtualizados = 0;
  let totalNaoEncontrados = 0;
  let totalErros = 0;

  try {
    // 1. Buscar registros do acervo
    console.log('\n📥 Buscando registros no banco de dados...');
    const registros = await buscarRegistrosAlvo();
    console.log(`   ✅ ${registros.length} registros encontrados para ${PROCESSOS_ALVO.length} números de processo`);

    if (registros.length === 0) {
      console.log('\n⚠️ Nenhum registro encontrado! Verifique se os números de processo estão corretos.');
      process.exit(0);
    }

    // Mostrar resumo dos registros com dados incompletos
    const semClasse = registros.filter(r => !r.classe_judicial || r.classe_judicial === 'Não informada');
    console.log(`   📊 Registros com classe_judicial vazia/não informada: ${semClasse.length}`);

    // 2. Agrupar por TRT/grau/advogado
    const grupos = agruparPorTRT(registros);
    console.log(`\n🔄 ${grupos.length} grupos TRT/grau para processar:`);
    for (const grupo of grupos) {
      console.log(`   • ${grupo.trt}/${grupo.grau} (advogado ${grupo.advogadoId}): ${grupo.registros.length} processos`);
    }

    if (config.dryRun) {
      console.log('\n⚠️  MODO DRY-RUN: Nenhuma alteração será persistida\n');
    }

    // 3. Processar cada grupo
    for (const grupo of grupos) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`📡 Processando ${grupo.trt}/${grupo.grau} (${grupo.registros.length} processos)...`);

      const resultado = await processarGrupo(grupo, config);

      totalAtualizados += resultado.atualizados;
      totalNaoEncontrados += resultado.naoEncontrados;
      totalErros += resultado.erros;

      console.log(`   📊 Resultado: ${resultado.atualizados} atualizados, ${resultado.naoEncontrados} não encontrados, ${resultado.erros} erros`);
    }

    // 4. Refresh da view materializada
    if (totalAtualizados > 0 && !config.dryRun) {
      console.log('\n🔄 Atualizando view materializada acervo_unificado...');
      const supabase = createServiceClient();
      const { error } = await supabase.rpc('refresh_acervo_unificado', { use_concurrent: true });
      if (error) {
        console.error(`   ⚠️ Erro ao atualizar view: ${error.message}`);
      } else {
        console.log('   ✅ View materializada atualizada');
      }
    }
  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error);
    process.exit(1);
  }

  // Resultado final
  const duracao = ((Date.now() - inicio) / 1000).toFixed(2);

  console.log('\n' + '═'.repeat(80));
  console.log('RESULTADO DA SINCRONIZAÇÃO');
  console.log('═'.repeat(80));
  console.log(`\n📊 Estatísticas:`);
  console.log(`   • Atualizados: ${totalAtualizados}`);
  console.log(`   • Não encontrados no painel: ${totalNaoEncontrados}`);
  console.log(`   • Erros: ${totalErros}`);
  console.log(`   • Duração: ${duracao}s`);

  if (config.dryRun) {
    console.log('\n⚠️  MODO DRY-RUN: Nenhuma alteração foi persistida!');
    console.log('   Execute sem --dry-run para aplicar as alterações.');
  }

  console.log('\n✅ Sincronização concluída!');
  process.exit(0);
}

main();
