/**
 * Serviço de captura de perícias do TRT
 * 
 * FLUXO:
 * 
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  🔐 FASE 1: AUTENTICAÇÃO                                        │
 * │  └── Login SSO PDPJ → OTP → JWT + Cookies                       │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  📡 FASE 2: BUSCAR PERÍCIAS                                    │
 * │  └── GET /pje-comum-api/api/pericias                            │
 * │  └── Retorno: perícias (cada uma com idProcesso)               │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  🔍 FASE 3: FILTRAR POR SITUAÇÕES                              │
 * │  └── Filtrar perícias pelas situações selecionadas             │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  📋 FASE 4: EXTRAIR PROCESSOS ÚNICOS                            │
 * │  └── Set(idProcesso) → processos únicos                         │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  🔄 FASE 5: DADOS COMPLEMENTARES (para cada processo)           │
 * │  ├── 🔍 Verificação de recaptura (pula se atualizado < 24h)     │
 * │  ├── 📜 Timeline: GET /processos/id/{id}/timeline               │
 * │  └── 👥 Partes: GET /processos/id/{id}/partes                   │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  💾 FASE 6: PERSISTÊNCIA (ordem garante integridade referencial)│
 * │  ├── 📦 Processos: upsert acervo (Supabase) respeitando origem  │
 * │  ├── 📜 Timeline: upsert (timeline_jsonb)                       │
 * │  ├── 👥 Partes: upsert entidades + vínculos                     │
 * │  └── 🔬 Perícias: upsert por último                             │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  🚪 FASE 7: FECHAR BROWSER                                      │
 * └─────────────────────────────────────────────────────────────────┘
 */

import { autenticarPJE, type AuthResult } from './trt-auth.service';
import type { CapturaTRTParams } from './trt-capture.service';
import { obterPericias } from '@/features/captura/pje-trt';
import type { Pericia } from '../../types/pericias-types';
import { salvarPericias, type SalvarPericiasResult } from '../persistence/pericias-persistence.service';
import { buscarOuCriarAdvogadoPorCpf } from '../advogado-helper.service';
import { captureLogService, type LogEntry } from '../persistence/capture-log.service';
import type { Processo } from '../../types/types';
import { obterProcessosAcervoGeral } from '@/features/captura/pje-trt/acervo-geral/obter-processos';
import { obterProcessosArquivados } from '@/features/captura/pje-trt/arquivados/obter-processos';
import { buscarDadosComplementaresProcessos } from './dados-complementares.service';
import { salvarAcervo } from '../persistence/acervo-persistence.service';
import { salvarTimeline } from '../timeline/timeline-persistence.service';
import { persistirPartesProcesso } from '../partes/partes-capture.service';
import type { TimelineItemEnriquecido } from '@/types/contracts/pje-trt';
import { createServiceClient } from '@/lib/supabase/service-client';

/**
 * Parâmetros específicos para captura de perícias
 */
export interface CapturaPericiasParams extends CapturaTRTParams {
  /** Situações das perícias a capturar: S, L, C, F, P, R */
  situacoes?: ('S' | 'L' | 'C' | 'F' | 'P' | 'R')[];
}

interface PericiasDadosComplementaresResumo {
  processosUnicos: number;
  processosPulados: number;
  timelinesCapturadas: number;
  partesCapturadas: number;
  erros: number;
}

/**
 * Resultado da captura de perícias
 */
export interface PericiasResult {
  pericias: Pericia[];
  total: number;
  persistencia?: SalvarPericiasResult;
  paginasBrutas?: unknown[];
  logs?: LogEntry[];
  dadosComplementares?: PericiasDadosComplementaresResumo;
  payloadsBrutosPartes?: Array<{
    processoId: number;
    numeroProcesso?: string;
    payloadBruto: Record<string, unknown> | null;
  }>;
}

function extrairProcessosUnicosDePericias(pericias: Pericia[]): number[] {
  const idsUnicos = [...new Set(pericias.map((p) => p.idProcesso))];
  console.log(
    `📋 [Perícias] ${idsUnicos.length} processos únicos extraídos de ${pericias.length} perícias`,
  );
  return idsUnicos;
}

function mapNumeroProcessoPorIdProcesso(pericias: Pericia[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const p of pericias) {
    if (!map.has(p.idProcesso) && p.numeroProcesso) {
      map.set(p.idProcesso, p.numeroProcesso);
    }
  }
  return map;
}

type OrigemProcesso = 'acervo_geral' | 'arquivado';

async function buscarProcessosPorIdsNoPainel(
  page: AuthResult['page'],
  params: {
    idAdvogado: number;
    processosIds: number[];
    delayEntrePaginas?: number;
  },
): Promise<{
  processosPorOrigem: Record<OrigemProcesso, Processo[]>;
  processosFaltantes: number[];
}> {
  const { idAdvogado, processosIds, delayEntrePaginas = 300 } = params;

  const faltantes = new Set(processosIds);
  const processosArquivados: Processo[] = [];
  const processosAcervo: Processo[] = [];

  // 1) Buscar primeiro em ARQUIVADOS (para respeitar origem quando aplicável)
  const paramsArquivados: Record<string, string | number | boolean> = {
    tipoPainelAdvogado: 5,
    ordenacaoCrescente: false,
    data: Date.now(),
  };

  console.log(`🔎 [Perícias] Buscando processos em Arquivados... (alvo: ${faltantes.size})`);

  {
    const primeiraPagina = await obterProcessosArquivados(page, idAdvogado, 1, 100, paramsArquivados);
    const registros = Array.isArray(primeiraPagina.resultado) ? primeiraPagina.resultado : [];

    for (const proc of registros) {
      if (faltantes.has(proc.id)) {
        processosArquivados.push(proc);
        faltantes.delete(proc.id);
      }
    }

    const qtdPaginas = primeiraPagina.qtdPaginas > 0 ? primeiraPagina.qtdPaginas : (registros.length > 0 ? 1 : 0);

    for (let p = 2; p <= qtdPaginas && faltantes.size > 0; p++) {
      await new Promise((resolve) => setTimeout(resolve, delayEntrePaginas));
      const pagina = await obterProcessosArquivados(page, idAdvogado, p, 100, paramsArquivados);
      const lista = Array.isArray(pagina.resultado) ? pagina.resultado : [];
      for (const proc of lista) {
        if (faltantes.has(proc.id)) {
          processosArquivados.push(proc);
          faltantes.delete(proc.id);
        }
      }
    }
  }

  console.log(`✅ [Perícias] Encontrados em Arquivados: ${processosArquivados.length} | faltantes: ${faltantes.size}`);

  // 2) Buscar o restante em ACERVO GERAL
  if (faltantes.size > 0) {
    console.log(`🔎 [Perícias] Buscando processos em Acervo Geral... (faltantes: ${faltantes.size})`);

    const primeiraPagina = await obterProcessosAcervoGeral(page, idAdvogado, 1, 100);
    const registros = Array.isArray(primeiraPagina.resultado) ? primeiraPagina.resultado : [];

    for (const proc of registros) {
      if (faltantes.has(proc.id)) {
        processosAcervo.push(proc);
        faltantes.delete(proc.id);
      }
    }

    const qtdPaginas = primeiraPagina.qtdPaginas > 0 ? primeiraPagina.qtdPaginas : (registros.length > 0 ? 1 : 0);

    for (let p = 2; p <= qtdPaginas && faltantes.size > 0; p++) {
      await new Promise((resolve) => setTimeout(resolve, delayEntrePaginas));
      const pagina = await obterProcessosAcervoGeral(page, idAdvogado, p, 100);
      const lista = Array.isArray(pagina.resultado) ? pagina.resultado : [];
      for (const proc of lista) {
        if (faltantes.has(proc.id)) {
          processosAcervo.push(proc);
          faltantes.delete(proc.id);
        }
      }
    }

    console.log(`✅ [Perícias] Encontrados em Acervo Geral: ${processosAcervo.length} | faltantes: ${faltantes.size}`);
  }

  return {
    processosPorOrigem: {
      arquivado: processosArquivados,
      acervo_geral: processosAcervo,
    },
    processosFaltantes: Array.from(faltantes),
  };
}

/**
 * Serviço de captura de perícias
 */
export async function periciasCapture(
  params: CapturaPericiasParams
): Promise<PericiasResult> {
  let authResult: AuthResult | null = null;

  try {
    // ═══════════════════════════════════════════════════════════════
    // FASE 1: AUTENTICAÇÃO
    // ═══════════════════════════════════════════════════════════════
    console.log('🔐 [Perícias] Fase 1: Autenticando no PJE...');
    authResult = await autenticarPJE({
      credential: params.credential,
      config: params.config,
      twofauthConfig: params.twofauthConfig,
      headless: true,
    });

    const { page, advogadoInfo } = authResult;
    console.log(`✅ [Perícias] Autenticado como: ${advogadoInfo.nome}`);

    // ═══════════════════════════════════════════════════════════════
    // FASE 2: BUSCAR PERÍCIAS
    // ═══════════════════════════════════════════════════════════════
    console.log('📡 [Perícias] Fase 2: Buscando perícias...');

    // obterPericias busca todas as situações automaticamente
    const todasPericias = await obterPericias(page, 500);

    console.log(`✅ [Perícias] ${todasPericias.length} perícias encontradas (todas as situações)`);

    // ═══════════════════════════════════════════════════════════════
    // FASE 3: FILTRAR POR SITUAÇÕES
    // ═══════════════════════════════════════════════════════════════
    let periciasFiltradas: Pericia[] = todasPericias;

    if (params.situacoes && params.situacoes.length > 0) {
      console.log(`🔍 [Perícias] Fase 3: Filtrando por situações: ${params.situacoes.join(', ')}`);
      periciasFiltradas = todasPericias.filter(p => 
        params.situacoes?.includes(p.situacao?.codigo as 'S' | 'L' | 'C' | 'F' | 'P' | 'R')
      );
      console.log(`✅ [Perícias] ${periciasFiltradas.length} perícias após filtro`);
    } else {
      console.log(`ℹ️ [Perícias] Nenhum filtro de situação aplicado, usando todas as ${todasPericias.length} perícias`);
    }

    // Se não há perícias, retornar imediatamente
    if (periciasFiltradas.length === 0) {
      return {
        pericias: [],
        total: 0,
      };
    }

    // ═══════════════════════════════════════════════════════════════
    // FASE 4: EXTRAIR PROCESSOS ÚNICOS
    // ═══════════════════════════════════════════════════════════════
    console.log('📋 [Perícias] Fase 4: Extraindo processos únicos...');
    const processosIds = extrairProcessosUnicosDePericias(periciasFiltradas);
    const numeroProcessoPorId = mapNumeroProcessoPorIdProcesso(periciasFiltradas);

    // ═══════════════════════════════════════════════════════════════
    // FASE 5: DADOS COMPLEMENTARES (timeline + partes) com recaptura
    // ═══════════════════════════════════════════════════════════════
    console.log('🔄 [Perícias] Fase 5: Buscando dados complementares dos processos...');

    const dadosComplementares = await buscarDadosComplementaresProcessos(
      page,
      processosIds,
      {
        buscarTimeline: true,
        buscarPartes: true,
        trt: params.config.codigo,
        grau: params.config.grau,
        verificarRecaptura: true,
        horasParaRecaptura: 24,
        delayEntreRequisicoes: 300,
        onProgress: (atual, total, processoId) => {
          if (atual % 10 === 0 || atual === 1 || atual === total) {
            console.log(`   📊 Progresso: ${atual}/${total} (processo ${processoId})`);
          }
        },
      },
    );

    // ═══════════════════════════════════════════════════════════════
    // FASE 6: PERSISTÊNCIA (acervo → timeline → partes → perícias)
    // ═══════════════════════════════════════════════════════════════
    console.log('💾 [Perícias] Fase 6: Persistindo dados...');

    // 4.1 Buscar/criar advogado
    const advogadoDb = await buscarOuCriarAdvogadoPorCpf(
      advogadoInfo.cpf,
      advogadoInfo.nome
    );

    // 6.1 Descobrir origem (acervo_geral vs arquivado) e obter dados de processos no painel
    const idAdvogadoPje = parseInt(advogadoInfo.idAdvogado, 10);
    if (isNaN(idAdvogadoPje)) {
      throw new Error(`ID do advogado inválido: ${advogadoInfo.idAdvogado}`);
    }

    const { processosPorOrigem, processosFaltantes } = await buscarProcessosPorIdsNoPainel(page, {
      idAdvogado: idAdvogadoPje,
      processosIds,
      delayEntrePaginas: 300,
    });

    if (processosFaltantes.length > 0) {
      console.warn(
        `⚠️ [Perícias] ${processosFaltantes.length} processos não encontrados em Acervo/Arquivados no painel. ` +
          `As perícias desses processos podem falhar na persistência se não existirem no acervo.`,
        { processosFaltantes: processosFaltantes.slice(0, 20) },
      );
    }

    // 6.2 Persistir processos no acervo, respeitando origem (para garantir IDs)
    console.log('   📦 Persistindo processos no acervo (respeitando origem)...');
    const mapeamentoIds = new Map<number, number>();

    // 6.2.1 Arquivados
    if (processosPorOrigem.arquivado.length > 0) {
      try {
        const persistenciaArquivados = await salvarAcervo({
          processos: processosPorOrigem.arquivado,
          advogadoId: advogadoDb.id,
          origem: 'arquivado',
          trt: params.config.codigo,
          grau: params.config.grau,
        });
        for (const [idPje, idAcervo] of persistenciaArquivados.mapeamentoIds) {
          mapeamentoIds.set(idPje, idAcervo);
        }
      } catch (e) {
        console.error('   ❌ Erro ao salvar processos arquivados no acervo:', e);
      }
    }

    // 6.2.2 Acervo Geral
    if (processosPorOrigem.acervo_geral.length > 0) {
      try {
        const persistenciaAcervo = await salvarAcervo({
          processos: processosPorOrigem.acervo_geral,
          advogadoId: advogadoDb.id,
          origem: 'acervo_geral',
          trt: params.config.codigo,
          grau: params.config.grau,
        });
        for (const [idPje, idAcervo] of persistenciaAcervo.mapeamentoIds) {
          mapeamentoIds.set(idPje, idAcervo);
        }
      } catch (e) {
        console.error('   ❌ Erro ao salvar processos do acervo geral:', e);
      }
    }

    // 6.2.3 Fallback: garantir existência no acervo para processos não encontrados no painel
    // - Não atualiza registros existentes (evita sobrescrever dados bons com defaults)
    // - Insere apenas se realmente não existir no acervo para (trt, grau)
    if (processosFaltantes.length > 0) {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('acervo')
        .select('id,id_pje')
        .in('id_pje', processosFaltantes)
        .eq('trt', params.config.codigo)
        .eq('grau', params.config.grau);

      if (error) {
        console.warn(`⚠️ [Perícias] Erro ao verificar processos faltantes no acervo: ${error.message}`);
      }

      const existentes = new Map<number, number>();
      for (const row of (data ?? []) as Array<{ id: number; id_pje: number }>) {
        existentes.set(row.id_pje, row.id);
      }

      // Adicionar ao mapeamento o que já existir no acervo
      for (const [idPje, idAcervo] of existentes) {
        mapeamentoIds.set(idPje, idAcervo);
      }

      const paraInserir = processosFaltantes.filter((id) => !existentes.has(id));

      if (paraInserir.length > 0) {
        console.warn(
          `⚠️ [Perícias] Inserindo ${paraInserir.length} processos mínimos no acervo (não encontrados no painel). ` +
            `Origem default: acervo_geral.`,
        );

        const processosMinimos: Processo[] = paraInserir.map((idPje) => {
          const numeroProcesso = (numeroProcessoPorId.get(idPje) || '').trim();
          const numero = parseInt(numeroProcesso.split('-')[0] ?? '', 10) || 0;

          return {
            id: idPje,
            descricaoOrgaoJulgador: '',
            classeJudicial: 'Não informada',
            numero,
            numeroProcesso,
            segredoDeJustica: false,
            codigoStatusProcesso: '',
            prioridadeProcessual: 0,
            nomeParteAutora: '',
            qtdeParteAutora: 1,
            nomeParteRe: '',
            qtdeParteRe: 1,
            dataAutuacao: new Date().toISOString(),
            juizoDigital: false,
            dataProximaAudiencia: null,
            temAssociacao: false,
          };
        });

        try {
          const persistenciaMinimos = await salvarAcervo({
            processos: processosMinimos,
            advogadoId: advogadoDb.id,
            origem: 'acervo_geral',
            trt: params.config.codigo,
            grau: params.config.grau,
          });
          for (const [idPje, idAcervo] of persistenciaMinimos.mapeamentoIds) {
            mapeamentoIds.set(idPje, idAcervo);
          }
        } catch (e) {
          console.error('   ❌ Erro ao inserir processos mínimos no acervo:', e);
        }
      }
    }

    console.log(
      `   ✅ Mapeamento acervo: ${mapeamentoIds.size}/${processosIds.length} processos com id disponível`,
    );

    // 6.3 Persistir timelines no PostgreSQL (JSONB) — apenas processos não pulados
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

    // 6.4 Persistir partes (usa dados já buscados, sem refetch da API)
    console.log('   👥 Persistindo partes...');
    let partesPersistidas = 0;
    for (const [processoId, dados] of dadosComplementares.porProcesso) {
      if (dados.partes && dados.partes.length > 0) {
        const idAcervo = mapeamentoIds.get(processoId);
        const numeroProcesso = numeroProcessoPorId.get(processoId);

        if (!idAcervo) {
          console.log(`   ⚠️ Processo ${processoId} não encontrado no mapeamento, pulando partes...`);
          continue;
        }

        try {
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
              id: idAdvogadoPje,
              documento: advogadoInfo.cpf,
              nome: advogadoInfo.nome,
            },
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
    console.log(`   ✅ ${partesPersistidas} processos com partes persistidas`);

    // 6.5 Persistir perícias (por último)
    console.log('   🔬 Persistindo perícias...');
    let persistencia: SalvarPericiasResult | undefined;
    let logsPersistencia: LogEntry[] | undefined;

    try {
      persistencia = await salvarPericias({
        pericias: periciasFiltradas,
        advogadoId: advogadoDb.id,
        trt: params.config.codigo,
        grau: params.config.grau,
      });

      console.log(`   ✅ Perícias persistidas:`, {
        inseridos: persistencia.inseridos,
        atualizados: persistencia.atualizados,
        naoAtualizados: persistencia.naoAtualizados,
        erros: persistencia.erros,
      });
    } catch (error) {
      console.error('❌ [Perícias] Erro ao salvar perícias:', error);
    } finally {
      captureLogService.imprimirResumo();
      logsPersistencia = captureLogService.consumirLogs();
    }

    // ═══════════════════════════════════════════════════════════════
    // RESULTADO FINAL
    // ═══════════════════════════════════════════════════════════════
    console.log('🏁 [Perícias] Captura concluída!');
    console.log(`   📊 Resumo:`);
    console.log(`      - Perícias encontradas: ${todasPericias.length}`);
    console.log(`      - Perícias filtradas: ${periciasFiltradas.length}`);
    console.log(`      - Perícias persistidas: ${persistencia?.inseridos || 0} inseridas, ${persistencia?.atualizados || 0} atualizadas`);
    console.log(`      - Processos únicos: ${processosIds.length}`);
    console.log(`      - Processos pulados (recaptura): ${dadosComplementares.resumo.processosPulados}`);
    console.log(`      - Timelines: ${dadosComplementares.resumo.timelinesObtidas}`);
    console.log(`      - Partes: ${dadosComplementares.resumo.partesObtidas}`);
    console.log(`      - Erros (dados complementares): ${dadosComplementares.resumo.erros}`);

    // Coletar payloads brutos de partes para salvar como raw logs no Supabase (se desejado)
    const payloadsBrutosPartes: Array<{
      processoId: number;
      numeroProcesso?: string;
      payloadBruto: Record<string, unknown> | null;
    }> = [];
    for (const [processoId, dados] of dadosComplementares.porProcesso) {
      if (dados.payloadBrutoPartes !== undefined) {
        payloadsBrutosPartes.push({
          processoId,
          numeroProcesso: numeroProcessoPorId.get(processoId),
          payloadBruto: dados.payloadBrutoPartes,
        });
      }
    }

    return {
      pericias: periciasFiltradas,
      total: periciasFiltradas.length,
      persistencia,
      logs: logsPersistencia,
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
    // FASE 7: FECHAR BROWSER
    // ═══════════════════════════════════════════════════════════════
    if (authResult?.browser) {
      console.log('🚪 [Perícias] Fechando browser...');
      await authResult.browser.close();
    }
  }
}

/**
 * Serviço de captura de perícias (wrapper para compatibilidade com rota de API)
 */
export async function capturarPericiasService(_params: {
  advogado_id: number;
  credencial_ids: number[];
  situacoes?: ('S' | 'L' | 'C' | 'F' | 'P' | 'R')[];
}): Promise<{
  success: boolean;
  data?: {
    credenciais_processadas: number;
    message: string;
  };
  capture_id?: number;
  error?: string;
}> {
  // Esta função será chamada pela rota de API
  // A implementação real será feita na rota, similar ao padrão de audiências
  throw new Error('Esta função deve ser chamada apenas pela rota de API');
}

