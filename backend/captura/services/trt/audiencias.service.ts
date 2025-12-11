/**
 * Serviço de captura de audiências do TRT
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
 * │  📡 FASE 2: BUSCAR AUDIÊNCIAS                                   │
 * │  └── GET /pauta-usuarios-externos                               │
 * │  └── Retorno: audiências (cada uma com idProcesso)              │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  📋 FASE 3: EXTRAIR PROCESSOS ÚNICOS                            │
 * │  └── Set(idProcesso) → processos únicos                         │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  🔄 FASE 4: DADOS COMPLEMENTARES (para cada processo)           │
 * │  ├── 📜 Timeline: GET /processos/id/{id}/timeline               │
 * │  └── 👥 Partes: GET /processos/id/{id}/partes                   │
 * │      └── (com delay de 300ms entre cada requisição)             │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  💾 FASE 5: PERSISTÊNCIA (ordem garante integridade referencial)│
 * │  ├── 📦 Processos: upsert acervo (Supabase) → retorna IDs       │
 * │  ├── 📜 Timeline: upsert (MongoDB)                              │
 * │  ├── 👥 Partes: upsert entidades + vínculos (com ID do acervo!) │
 * │  └── 🎤 Audiências: upsert (Supabase)                           │
 * └─────────────────────────────────────────────────────────────────┘
 *                               │
 *                               ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  🚪 FASE 6: FECHAR BROWSER                                      │
 * └─────────────────────────────────────────────────────────────────┘
 */

import { autenticarPJE, type AuthResult } from './trt-auth.service';
import type { CapturaAudienciasParams } from './trt-capture.service';
import { obterTodasAudiencias } from '@/backend/api/pje-trt';
import type { Audiencia, PagedResponse } from '@/backend/types/pje-trt/types';
import { salvarAudiencias, type SalvarAudienciasResult } from '../persistence/audiencias-persistence.service';
import { obterTimeline } from '@/backend/api/pje-trt/timeline/obter-timeline';
import { obterDocumento } from '@/backend/api/pje-trt/timeline/obter-documento';
import { baixarDocumento } from '@/backend/api/pje-trt/timeline/baixar-documento';
import { uploadToBackblaze } from '@/backend/storage/backblaze-b2.service';
import { gerarNomeDocumentoAudiencia, gerarCaminhoDocumento } from '@/backend/storage/file-naming.utils';
import { buscarOuCriarAdvogadoPorCpf } from '@/backend/utils/captura/advogado-helper.service';
import { captureLogService, type LogEntry } from '../persistence/capture-log.service';
import {
  buscarDadosComplementaresProcessos,
  extrairProcessosUnicos,
} from './dados-complementares.service';
import { salvarTimelineNoMongoDB } from '../timeline/timeline-persistence.service';
import { persistirPartesProcesso } from '../partes/partes-capture.service';
import type { TimelineItemEnriquecido } from '@/lib/api/pje-trt/types';

/**
 * Resultado da captura de audiências
 */
export interface AudienciasResult {
  audiencias: Audiencia[];
  total: number;
  dataInicio: string;
  dataFim: string;
  persistencia?: SalvarAudienciasResult;
  paginasBrutas?: PagedResponse<Audiencia>[];
  logs?: LogEntry[];
  /** Novos campos para dados complementares */
  dadosComplementares?: {
    processosUnicos: number;
    processosPulados: number;
    timelinesCapturadas: number;
    partesCapturadas: number;
    erros: number;
  };
  /** Payloads brutos de partes por processo (para salvar no MongoDB) */
  payloadsBrutosPartes?: Array<{
    processoId: number;
    numeroProcesso?: string;
    payloadBruto: Record<string, unknown> | null;
  }>;
}

/**
 * Calcula data de hoje no formato YYYY-MM-DD
 */
function getDataHoje(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calcula data de hoje + 365 dias no formato YYYY-MM-DD
 */
function getDataUmAnoDepois(): string {
  const hoje = new Date();
  const umAnoDepois = new Date(hoje);
  umAnoDepois.setFullYear(hoje.getFullYear() + 1);
  return umAnoDepois.toISOString().split('T')[0];
}

/**
 * Valida formato de data (YYYY-MM-DD)
 */
function validarFormatoData(data: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(data)) {
    return false;
  }

  const date = new Date(data);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Serviço de captura de audiências (fluxo otimizado)
 * 
 * Agora aproveita a sessão autenticada para:
 * 1. Buscar audiências
 * 2. Buscar timeline de cada processo
 * 3. Buscar partes de cada processo
 * 4. Persistir tudo
 */
export async function audienciasCapture(
  params: CapturaAudienciasParams
): Promise<AudienciasResult> {
  let authResult: AuthResult | null = null;

  try {
    // ═══════════════════════════════════════════════════════════════
    // FASE 1: AUTENTICAÇÃO
    // ═══════════════════════════════════════════════════════════════
    console.log('🔐 [Audiências] Fase 1: Autenticando no PJE...');
    authResult = await autenticarPJE({
      credential: params.credential,
      config: params.config,
      twofauthConfig: params.twofauthConfig,
      headless: true,
    });

    const { page, advogadoInfo } = authResult;
    console.log(`✅ [Audiências] Autenticado como: ${advogadoInfo.nome}`);

    // ═══════════════════════════════════════════════════════════════
    // FASE 2: BUSCAR AUDIÊNCIAS
    // ═══════════════════════════════════════════════════════════════
    console.log('📡 [Audiências] Fase 2: Buscando audiências...');

    // Calcular período de busca
    let dataInicio: string;
    let dataFim: string;

    if (params.dataInicio) {
      if (!validarFormatoData(params.dataInicio)) {
        throw new Error(`Formato de dataInicio inválido: ${params.dataInicio}. Use formato YYYY-MM-DD.`);
      }
      dataInicio = params.dataInicio;
    } else {
      dataInicio = getDataHoje();
    }

    if (params.dataFim) {
      if (!validarFormatoData(params.dataFim)) {
        throw new Error(`Formato de dataFim inválido: ${params.dataFim}. Use formato YYYY-MM-DD.`);
      }
      dataFim = params.dataFim;
    } else {
      dataFim = getDataUmAnoDepois();
    }

    if (new Date(dataInicio) > new Date(dataFim)) {
      throw new Error(`dataInicio (${dataInicio}) não pode ser posterior a dataFim (${dataFim}).`);
    }

    const codigoSituacao = params.codigoSituacao || 'M';
    console.log(`📅 [Audiências] Período: ${dataInicio} a ${dataFim} | Situação: ${codigoSituacao}`);

    const { audiencias, paginas } = await obterTodasAudiencias(
      page,
      dataInicio,
      dataFim,
      codigoSituacao
    );

    console.log(`✅ [Audiências] ${audiencias.length} audiências encontradas`);

    // Se não há audiências, retornar imediatamente
    if (audiencias.length === 0) {
      return {
        audiencias: [],
        total: 0,
        dataInicio,
        dataFim,
        paginasBrutas: paginas,
      };
    }

    // ═══════════════════════════════════════════════════════════════
    // FASE 3: EXTRAIR PROCESSOS ÚNICOS
    // ═══════════════════════════════════════════════════════════════
    console.log('📋 [Audiências] Fase 3: Extraindo processos únicos...');
    const processosIds = extrairProcessosUnicos(audiencias);
    console.log(`✅ [Audiências] ${processosIds.length} processos únicos identificados`);

    // ═══════════════════════════════════════════════════════════════
    // FASE 4: BUSCAR DADOS COMPLEMENTARES
    // ═══════════════════════════════════════════════════════════════
    console.log('🔄 [Audiências] Fase 4: Buscando dados complementares dos processos...');

    const dadosComplementares = await buscarDadosComplementaresProcessos(
      page,
      processosIds,
      {
        buscarTimeline: true,
        buscarPartes: true,
        trt: params.config.codigo,
        grau: params.config.grau,
        delayEntreRequisicoes: 300,
        verificarRecaptura: true,  // Pula processos atualizados recentemente
        horasParaRecaptura: 24,    // Recaptura se > 24h desde última atualização
        onProgress: (atual, total, processoId) => {
          if (atual % 5 === 0 || atual === total) {
            console.log(`   📊 Progresso: ${atual}/${total} (processo ${processoId})`);
          }
        },
      }
    );

    console.log(`✅ [Audiências] Dados complementares obtidos:`, dadosComplementares.resumo);

    // ═══════════════════════════════════════════════════════════════
    // FASE 5: PERSISTÊNCIA
    // ═══════════════════════════════════════════════════════════════
    console.log('💾 [Audiências] Fase 5: Persistindo dados...');

    // 5.1 Buscar/criar advogado
    const advogadoDb = await buscarOuCriarAdvogadoPorCpf(
      advogadoInfo.cpf,
      advogadoInfo.nome
    );

    // 5.2 Buscar IDs dos processos no acervo (para vínculos de partes)
    // NOTA: Os dados de audiência (ProcessoAudiencia) são parciais e não incluem todos os campos
    // necessários para salvar no acervo. Os processos devem ser capturados via acervo geral.
    // Aqui apenas buscamos os IDs existentes para criar os vínculos.
    console.log('   📦 Buscando processos no acervo...');
    const mapeamentoIds = new Map<number, number>();

    // Reutiliza lista de IDs já extraída na fase 3
    const supabase = (await import('@/backend/utils/supabase/service-client')).createServiceClient();

    for (const idPje of processosIds) {
      const { data } = await supabase
        .from('acervo')
        .select('id')
        .eq('id_pje', idPje)
        .eq('trt', params.config.codigo)
        .eq('grau', params.config.grau)
        .maybeSingle();

      if (data?.id) {
        mapeamentoIds.set(idPje, data.id);
      }
    }

    console.log(`   ✅ ${mapeamentoIds.size}/${processosIds.length} processos encontrados no acervo`);

    // 5.3 Persistir timelines no MongoDB
    console.log('   📜 Persistindo timelines...');
    let timelinesPersistidas = 0;
    for (const [processoId, dados] of dadosComplementares.porProcesso) {
      if (dados.timeline && Array.isArray(dados.timeline) && dados.timeline.length > 0) {
        try {
          await salvarTimelineNoMongoDB({
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
    console.log(`   ✅ ${timelinesPersistidas} timelines persistidas`);

    // 5.4 Persistir partes (usa dados já buscados, sem refetch da API)
    console.log('   👥 Persistindo partes...');
    let partesPersistidas = 0;
    let partesComVinculo = 0;
    for (const [processoId, dados] of dadosComplementares.porProcesso) {
      if (dados.partes && dados.partes.length > 0) {
        try {
          // Buscar ID do processo no acervo (persistido no passo 5.2)
          const idAcervo = mapeamentoIds.get(processoId);

          // Buscar número do processo da audiência
          const audienciaDoProcesso = audiencias.find(a => a.idProcesso === processoId);
          const numeroProcesso = audienciaDoProcesso?.nrProcesso || audienciaDoProcesso?.processo?.numero;

          // Usa persistirPartesProcesso em vez de capturarPartesProcesso
          // para evitar refetch da API (partes já foram buscadas em dados-complementares)
          await persistirPartesProcesso(
            dados.partes,
            {
              id_pje: processoId,
              trt: params.config.codigo,
              grau: params.config.grau === 'primeiro_grau' ? 'primeiro_grau' : 'segundo_grau',
              id: idAcervo, // ID do acervo para criar vínculo!
              numero_processo: numeroProcesso,
            },
            {
              id: parseInt(advogadoInfo.idAdvogado, 10),
              documento: advogadoInfo.cpf,
              nome: advogadoInfo.nome,
            }
          );
          partesPersistidas++;
          if (idAcervo) partesComVinculo++;
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
    console.log(`   ✅ ${partesPersistidas} processos com partes persistidas (${partesComVinculo} com vínculo)`);

    // 5.5 Processar atas para audiências realizadas
    const atasMap: Record<number, { documentoId: number; url: string }> = {};
    if (codigoSituacao === 'F') {
      console.log('   📄 Buscando atas de audiências realizadas...');
      for (const a of audiencias) {
        try {
          // Usar timeline já capturada se disponível
          const dadosProcesso = dadosComplementares.porProcesso.get(a.idProcesso);
          const timeline = dadosProcesso?.timeline || await obterTimeline(page, String(a.idProcesso), {
            somenteDocumentosAssinados: true,
            buscarDocumentos: true,
            buscarMovimentos: false,
          });

          const candidato = timeline.find(d =>
            d.documento &&
            ((d.tipo || '').toLowerCase().includes('ata') || (d.titulo || '').toLowerCase().includes('ata'))
          );

          if (candidato && candidato.id) {
            const documentoId = candidato.id;
            const docDetalhes = await obterDocumento(page, String(a.idProcesso), String(documentoId), {
              incluirAssinatura: true,
              grau: 1,
            });
            const pdf = await baixarDocumento(page, String(a.idProcesso), String(documentoId), {
              incluirCapa: false,
              incluirAssinatura: true,
              grau: 1,
            });
            const nomeArquivo = gerarNomeDocumentoAudiencia(a.id);
            const key = gerarCaminhoDocumento(a.nrProcesso || a.processo?.numero || '', 'audiencias', nomeArquivo);
            const upload = await uploadToBackblaze({ buffer: pdf, key, contentType: 'application/pdf' });
            atasMap[a.id] = { documentoId: docDetalhes.id, url: upload.url };
          }
        } catch (e) {
          captureLogService.logErro('audiencias', e instanceof Error ? e.message : String(e), {
            id_pje: a.id,
            numero_processo: a.nrProcesso || a.processo?.numero,
            trt: params.config.codigo,
            grau: params.config.grau,
            tipo: 'ata',
          });
        }
      }
    }

    // 5.6 Persistir audiências
    console.log('   🎤 Persistindo audiências...');
    let persistencia: SalvarAudienciasResult | undefined;
    let logsPersistencia: LogEntry[] | undefined;

    try {
      persistencia = await salvarAudiencias({
        audiencias,
        advogadoId: advogadoDb.id,
        trt: params.config.codigo,
        grau: params.config.grau,
        atas: atasMap,
      });

      console.log(`   ✅ Audiências persistidas:`, {
        inseridos: persistencia.inseridos,
        atualizados: persistencia.atualizados,
        naoAtualizados: persistencia.naoAtualizados,
        erros: persistencia.erros,
      });
    } catch (error) {
      console.error('❌ [Audiências] Erro ao salvar audiências:', error);
    } finally {
      captureLogService.imprimirResumo();
      logsPersistencia = captureLogService.consumirLogs();
    }

    // ═══════════════════════════════════════════════════════════════
    // RESULTADO FINAL
    // ═══════════════════════════════════════════════════════════════
    console.log('🏁 [Audiências] Captura concluída!');
    console.log(`   📊 Resumo:`);
    console.log(`      - Audiências: ${audiencias.length}`);
    console.log(`      - Processos únicos: ${processosIds.length}`);
    console.log(`      - Processos pulados: ${dadosComplementares.resumo.processosPulados}`);
    console.log(`      - Timelines: ${dadosComplementares.resumo.timelinesObtidas}`);
    console.log(`      - Partes: ${dadosComplementares.resumo.partesObtidas}`);
    console.log(`      - Erros: ${dadosComplementares.resumo.erros}`);

    // Coletar payloads brutos de partes para salvar no MongoDB
    const payloadsBrutosPartes: Array<{
      processoId: number;
      numeroProcesso?: string;
      payloadBruto: Record<string, unknown> | null;
    }> = [];
    for (const [processoId, dados] of dadosComplementares.porProcesso) {
      if (dados.payloadBrutoPartes !== undefined) {
        // Buscar número do processo da audiência correspondente
        const audienciaDoProcesso = audiencias.find(a => a.idProcesso === processoId);
        const numeroProcesso = audienciaDoProcesso?.nrProcesso || audienciaDoProcesso?.processo?.numero;
        payloadsBrutosPartes.push({
          processoId,
          numeroProcesso,
          payloadBruto: dados.payloadBrutoPartes,
        });
      }
    }
    console.log(`   📦 Payloads de partes coletados: ${payloadsBrutosPartes.length}`);

    return {
      audiencias,
      total: audiencias.length,
      dataInicio,
      dataFim,
      persistencia,
      paginasBrutas: paginas,
      logs: logsPersistencia,
      dadosComplementares: {
        processosUnicos: processosIds.length,
        processosPulados: dadosComplementares.resumo.processosPulados,
        timelinesCapturadas: dadosComplementares.resumo.timelinesObtidas,
        partesCapturadas: dadosComplementares.resumo.partesObtidas,
        erros: dadosComplementares.resumo.erros,
      },
      payloadsBrutosPartes,
    };
  } finally {
    // ═══════════════════════════════════════════════════════════════
    // FASE 6: FECHAR BROWSER
    // ═══════════════════════════════════════════════════════════════
    if (authResult?.browser) {
      console.log('🚪 [Audiências] Fechando browser...');
      await authResult.browser.close();
    }
  }
}
