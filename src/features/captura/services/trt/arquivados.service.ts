/**
 * Serviço de captura de processos arquivados do TRT
 * 
 * FLUXO OTIMIZADO (aproveita sessão autenticada):
 * 
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  🔐 FASE 1: AUTENTICAÇÃO                                        │
 * │  └── Login SSO PDPJ → OTP → JWT + Cookies                       │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  📡 FASE 2: BUSCAR PROCESSOS ARQUIVADOS                         │
 * │  └── GET /paineladvogado/{id}/processos?tipoPainelAdvogado=5    │
 * │  └── Retorno: processos arquivados                              │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  📋 FASE 3: EXTRAIR IDs ÚNICOS                                  │
 * │  └── Set(id) → processos únicos                                 │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  🔄 FASE 4: DADOS COMPLEMENTARES (para cada processo)           │
 * │  ├── 🔍 Verificação de recaptura (pula se atualizado < 6h)      │
 * │  ├── 📜 Timeline: GET /processos/id/{id}/timeline               │
 * │  └── 👥 Partes: GET /processos/id/{id}/partes                   │
 * │      └── (com delay de 300ms entre cada requisição)             │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  💾 FASE 5: PERSISTÊNCIA (ordem garante integridade referencial)│
 * │  ├── 📦 Processos: upsert acervo (Supabase) → retorna IDs       │
 * │  ├── 📜 Timeline: upsert (timeline_jsonb no Supabase)           │
 * │  └── 👥 Partes: upsert entidades + vínculos - apenas não pulados│
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  🚪 FASE 6: FECHAR BROWSER                                      │
 * └─────────────────────────────────────────────────────────────────┘
 */

import { autenticarPJE, type AuthResult } from './trt-auth.service';
import type { CapturaTRTParams } from './trt-capture.service';
import { obterTodosProcessosArquivados } from '@/features/captura/pje-trt';
import type { Processo } from '../../types/types';
import { salvarAcervoBatch, type SalvarAcervoResult } from '../persistence/acervo-persistence.service';
import { buscarOuCriarAdvogadoPorCpf } from '../advogado-helper.service';
import { captureLogService, type LogEntry } from '../persistence/capture-log.service';
import { buscarDadosComplementaresProcessos } from './dados-complementares.service';
import { salvarTimeline } from '../timeline/timeline-persistence.service';
import { persistirPartesProcesso } from '../partes/partes-capture.service';
import type { TimelineItemEnriquecido } from '@/types/contracts/pje-trt';

/**
 * Resultado da captura de processos arquivados
 */
export interface ArquivadosResult {
  processos: Processo[];
  total: number;
  persistencia?: SalvarAcervoResult;
  logs?: LogEntry[];
  payloadBruto?: Processo[];
  /** Dados complementares capturados */
  dadosComplementares?: {
    processosUnicos: number;
    processosPulados: number;
    timelinesCapturadas: number;
    partesCapturadas: number;
    erros: number;
  };
  /** Payloads brutos de partes por processo (para salvar como raw logs no Supabase) */
  payloadsBrutosPartes?: Array<{
    processoId: number;
    numeroProcesso?: string;
    payloadBruto: Record<string, unknown> | null;
  }>;
}

/**
 * Extrai IDs únicos de processos
 */
function extrairProcessosUnicosDeArquivados(processos: Processo[]): number[] {
  const idsUnicos = [...new Set(processos.map(p => p.id))];
  console.log(`📋 [Arquivados] ${idsUnicos.length} processos únicos extraídos`);
  return idsUnicos;
}

/**
 * Serviço de captura de processos arquivados
 * 
 * Fluxo otimizado em 6 fases:
 * 1. Autenticação
 * 2. Buscar processos arquivados (API)
 * 3. Extrair IDs únicos
 * 4. Buscar dados complementares (timeline, partes) com verificação de recaptura
 * 5. Persistência (acervo -> timeline -> partes)
 * 6. Fechar browser
 */
export async function arquivadosCapture(
  params: CapturaTRTParams
): Promise<ArquivadosResult> {
  let authResult: AuthResult | null = null;

  try {
    // ═══════════════════════════════════════════════════════════════
    // FASE 1: AUTENTICAÇÃO
    // ═══════════════════════════════════════════════════════════════
    console.log('🔐 [Arquivados] Fase 1: Autenticando...');
    authResult = await autenticarPJE({
      credential: params.credential,
      config: params.config,
      headless: true,
    });

    const { page, advogadoInfo } = authResult;
    console.log(`✅ [Arquivados] Autenticado como: ${advogadoInfo.nome}`);

    // ═══════════════════════════════════════════════════════════════
    // FASE 2: BUSCAR PROCESSOS ARQUIVADOS
    // ═══════════════════════════════════════════════════════════════
    console.log('📡 [Arquivados] Fase 2: Buscando processos arquivados...');

    const idAdvogado = parseInt(advogadoInfo.idAdvogado, 10);
    if (isNaN(idAdvogado)) {
      throw new Error(`ID do advogado inválido: ${advogadoInfo.idAdvogado}`);
    }

    // Parâmetros específicos para arquivados
    const paramsAdicionais: Record<string, string | number | boolean> = {
      tipoPainelAdvogado: 5,
      ordenacaoCrescente: false,
      data: Date.now(),
    };

    // Buscar processos
    const processos = await obterTodosProcessosArquivados(
      page,
      idAdvogado,
      500,
      paramsAdicionais
    );

    console.log(`✅ [Arquivados] ${processos.length} processos encontrados`);

    if (processos.length === 0) {
      console.log('ℹ️ [Arquivados] Nenhum processo encontrado');
      return {
        processos: [],
        total: 0,
      };
    }

    // ═══════════════════════════════════════════════════════════════
    // FASE 3: EXTRAIR IDs ÚNICOS
    // ═══════════════════════════════════════════════════════════════
    console.log('📋 [Arquivados] Fase 3: Extraindo IDs únicos...');
    const processosIds = extrairProcessosUnicosDeArquivados(processos);

    // ═══════════════════════════════════════════════════════════════
    // FASE 4: BUSCAR DADOS COMPLEMENTARES (com verificação de recaptura)
    // ═══════════════════════════════════════════════════════════════
    console.log('🔄 [Arquivados] Fase 4: Buscando dados complementares...');

    const dadosComplementares = await buscarDadosComplementaresProcessos(
      page,
      processosIds,
      {
        buscarTimeline: true,
        buscarPartes: true,
        trt: params.config.codigo,
        grau: params.config.grau,
        verificarRecaptura: true,  // Pula processos atualizados recentemente
        horasParaRecaptura: 24,    // Recaptura se > 24h desde última atualização
        onProgress: (atual, total, processoId) => {
          if (atual % 10 === 0 || atual === 1 || atual === total) {
            console.log(`   📊 Progresso: ${atual}/${total} (processo ${processoId})`);
          }
        },
      }
    );

    // ═══════════════════════════════════════════════════════════════
    // FASE 5: PERSISTÊNCIA
    // ═══════════════════════════════════════════════════════════════
    console.log('💾 [Arquivados] Fase 5: Persistindo dados...');

    // 5.1 Buscar/criar advogado
    const advogadoDb = await buscarOuCriarAdvogadoPorCpf(
      advogadoInfo.cpf,
      advogadoInfo.nome
    );

    // 5.2 Persistir processos no acervo (PRIMEIRO para obter IDs)
    console.log('   📦 Persistindo processos arquivados no acervo...');
    let persistencia: SalvarAcervoResult | undefined;
    let mapeamentoIds = new Map<number, number>();

    try {
      persistencia = await salvarAcervoBatch({
        processos,
        advogadoId: advogadoDb.id,
        origem: 'arquivado',
        trt: params.config.codigo,
        grau: params.config.grau,
      });

      mapeamentoIds = persistencia.mapeamentoIds;
      console.log(`   ✅ ${persistencia.total} processos processados (${persistencia.inseridos} inseridos, ${persistencia.atualizados} atualizados, ${persistencia.naoAtualizados} sem alteração, ${persistencia.erros} erros)`);
    } catch (error) {
      console.error('   ❌ Erro ao salvar processos arquivados no acervo:', error);
    }

    // 5.3 Persistir timelines no PostgreSQL (apenas para processos não pulados)
    console.log('   📜 Persistindo timelines no PostgreSQL...');
    let timelinesPersistidas = 0;
    for (const [processoId, dados] of dadosComplementares.porProcesso) {
      if (dados.timeline && Array.isArray(dados.timeline) && dados.timeline.length > 0) {
        try {
          await salvarTimeline({
            processoId: String(processoId),
            trtCodigo: params.config.codigo,
            grau: params.config.grau,
            timeline: dados.timeline as TimelineItemEnriquecido[],
            advogadoId: advogadoDb.id,
          });
          timelinesPersistidas++;
        } catch (e) {
          console.warn(`   ⚠️ Erro ao persistir timeline do processo ${processoId}:`, e);
          captureLogService.logErro('timeline', e instanceof Error ? e.message : String(e), {
            processoId,
            trt: params.config.codigo,
            grau: params.config.grau,
          });
        }
      }
    }
    console.log(`   ✅ ${timelinesPersistidas} timelines persistidas no PostgreSQL`);

    // 5.4 Persistir partes (usa dados já buscados, sem refetch da API)
    console.log('   👥 Persistindo partes...');
    let partesPersistidas = 0;

    if (mapeamentoIds.size === 0 && dadosComplementares.porProcesso.size > 0) {
      console.warn('   ⚠️ Pulando persistência de partes: mapeamento de IDs do acervo está vazio (salvarAcervoBatch pode ter falhado)');
    } else {
      for (const [processoId, dados] of dadosComplementares.porProcesso) {
        if (dados.partes && dados.partes.length > 0) {
          const idAcervo = mapeamentoIds.get(processoId);

          if (!idAcervo) {
            console.log(`   ⚠️ Processo ${processoId} não encontrado no mapeamento, pulando partes...`);
            continue;
          }

          try {
            const processo = processos.find(p => p.id === processoId);
            const numeroProcesso = processo?.numeroProcesso;

            // Usa persistirPartesProcesso em vez de capturarPartesProcesso
            // para evitar refetch da API (partes já foram buscadas em dados-complementares)
            await persistirPartesProcesso(
              dados.partes,
              {
                id_pje: processoId,
                trt: params.config.codigo,
                grau: params.config.grau === 'primeiro_grau' ? 'primeiro_grau' : 'segundo_grau',
                id: idAcervo,
                numero_processo: numeroProcesso,
              },
              {
                id: parseInt(advogadoInfo.idAdvogado, 10),
                documento: advogadoInfo.cpf,
                nome: advogadoInfo.nome,
              }
            );
            partesPersistidas++;
          } catch (e) {
            console.warn(`   ⚠️ Erro ao persistir partes do processo ${processoId}:`, e);
            captureLogService.logErro('partes', e instanceof Error ? e.message : String(e), {
              processoId,
              trt: params.config.codigo,
              grau: params.config.grau,
            });
          }
        }
      }
    }
    console.log(`   ✅ ${partesPersistidas} processos com partes persistidas`);

    // Finalizar logs
    captureLogService.imprimirResumo();
    const logsPersistencia = captureLogService.consumirLogs();

    // ═══════════════════════════════════════════════════════════════
    // RESULTADO FINAL
    // ═══════════════════════════════════════════════════════════════
    console.log('🏁 [Arquivados] Captura concluída!');
    console.log(`   📊 Resumo:`);
    console.log(`      - Processos: ${processos.length}`);
    console.log(`      - Processos pulados: ${dadosComplementares.resumo.processosPulados}`);
    console.log(`      - Timelines: ${dadosComplementares.resumo.timelinesObtidas}`);
    console.log(`      - Partes: ${dadosComplementares.resumo.partesObtidas}`);
    console.log(`      - Erros: ${dadosComplementares.resumo.erros}`);

    // Coletar payloads brutos de partes para salvar como raw logs no Supabase
    const payloadsBrutosPartes: Array<{
      processoId: number;
      numeroProcesso?: string;
      payloadBruto: Record<string, unknown> | null;
    }> = [];
    for (const [processoId, dados] of dadosComplementares.porProcesso) {
      if (dados.payloadBrutoPartes !== undefined) {
        // Buscar número do processo
        const processoCorrespondente = processos.find(p => p.id === processoId);
        const numeroProcesso = processoCorrespondente?.numeroProcesso || (processoCorrespondente?.numero ? String(processoCorrespondente.numero) : undefined);
        payloadsBrutosPartes.push({
          processoId,
          numeroProcesso,
          payloadBruto: dados.payloadBrutoPartes,
        });
      }
    }
    console.log(`   📦 Payloads de partes coletados: ${payloadsBrutosPartes.length}`);

    return {
      processos,
      total: processos.length,
      persistencia,
      logs: logsPersistencia,
      payloadBruto: processos,
      dadosComplementares: {
        processosUnicos: processosIds.length,
        processosPulados: dadosComplementares.resumo.processosPulados,
        timelinesCapturadas: timelinesPersistidas,
        partesCapturadas: partesPersistidas,
        erros: dadosComplementares.resumo.erros,
      },
      payloadsBrutosPartes,
    };
  } finally {
    // ═══════════════════════════════════════════════════════════════
    // FASE 6: FECHAR BROWSER
    // ═══════════════════════════════════════════════════════════════
    if (authResult?.browser) {
      console.log('🚪 [Arquivados] Fechando browser...');
      await authResult.browser.close();
    }
  }
}
