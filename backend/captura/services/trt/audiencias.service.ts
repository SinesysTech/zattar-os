// Serviço específico para captura de audiências do TRT
// Usa API REST do PJE (não faz scraping HTML)

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
 * Serviço de captura de audiências
 * 
 * Fluxo:
 * 1. Recebe parâmetros (TRT, grau, credenciais, datas opcionais)
 * 2. Chama autenticação (autenticarPJE)
 * 3. Calcula período de busca (usa datas fornecidas ou padrão: hoje até +365 dias)
 * 4. Chama API REST para obter pauta de audiências
 * 5. Retorna todas as audiências (com paginação automática)
 * 6. Limpa recursos
 * 
 * Comportamento:
 * - Se dataInicio não fornecida: usa hoje
 * - Se dataFim não fornecida: usa hoje + 365 dias
 * - Se ambas fornecidas: usa as datas fornecidas
 */
export async function audienciasCapture(
  params: CapturaAudienciasParams
): Promise<AudienciasResult> {
  let authResult: AuthResult | null = null;

  try {
    // 1. Autenticar no PJE
    authResult = await autenticarPJE({
      credential: params.credential,
      config: params.config,
      twofauthConfig: params.twofauthConfig,
      headless: true,
    });

    const { page } = authResult;

    // 2. Calcular período de busca
    // Se não fornecido, usa padrão: hoje até +365 dias
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

    // Validar que dataInicio <= dataFim
    if (new Date(dataInicio) > new Date(dataFim)) {
      throw new Error(`dataInicio (${dataInicio}) não pode ser posterior a dataFim (${dataFim}).`);
    }

    // 3. Chamar API REST para obter pauta de audiências
    // codigoSituacao: 'M' = Designada, 'C' = Cancelada, 'F' = Realizada
    const codigoSituacao = params.codigoSituacao || 'M';
    console.log('📡 Chamando API de audiências...', {
      dataInicio,
      dataFim,
      codigoSituacao,
    });

    const { audiencias, paginas } = await obterTodasAudiencias(
      page,
      dataInicio,
      dataFim,
      params.codigoSituacao || 'M' // Padrão: Marcadas/Designadas
    );

    console.log('✅ API de audiências retornou:', {
      total: audiencias.length,
      primeiras3: audiencias.slice(0, 3).map((a) => ({
        processo: a.processo?.numero,
        dataInicio: a.dataInicio,
        status: a.status,
      })),
    });

    // 4. Salvar audiências no banco de dados
    let persistencia: SalvarAudienciasResult | undefined;
    let logsPersistencia: LogEntry[] | undefined;
    try {
      const advogadoDb = await buscarOuCriarAdvogadoPorCpf(
        authResult.advogadoInfo.cpf,
        authResult.advogadoInfo.nome
      );
      const atasMap: Record<number, { documentoId: number; url: string }> = {};
      if ((params.codigoSituacao || 'M') === 'F') {
        for (const a of audiencias) {
          try {
            const timeline = await obterTimeline(page, String(a.idProcesso), { somenteDocumentosAssinados: true, buscarDocumentos: true, buscarMovimentos: false });
            const candidato = timeline.find(d => d.documento && ((d.tipo || '').toLowerCase().includes('ata') || (d.titulo || '').toLowerCase().includes('ata')));
            if (candidato && candidato.id) {
              const documentoId = candidato.id;
              const docDetalhes = await obterDocumento(page, String(a.idProcesso), String(documentoId), { incluirAssinatura: true, grau: 1 });
              const pdf = await baixarDocumento(page, String(a.idProcesso), String(documentoId), { incluirCapa: false, incluirAssinatura: true, grau: 1 });
              const nomeArquivo = gerarNomeDocumentoAudiencia(a.id);
              const key = gerarCaminhoDocumento(a.nrProcesso || a.processo?.numero || '', 'audiencias', nomeArquivo);
              const upload = await uploadToBackblaze({ buffer: pdf, key, contentType: 'application/pdf' });
              atasMap[a.id] = { documentoId: docDetalhes.id, url: upload.url };
            }
          } catch (e) {
            captureLogService.logErro('audiencias_atas', e instanceof Error ? e.message : String(e), { id_pje: a.id, numero_processo: a.nrProcesso || a.processo?.numero, trt: params.config.codigo, grau: params.config.grau });
          }
        }
      }

      persistencia = await salvarAudiencias({
        audiencias,
        advogadoId: advogadoDb.id,
        trt: params.config.codigo,
        grau: params.config.grau,
        atas: atasMap,
      });

      console.log('✅ Audiências salvas no banco:', {
        total: persistencia.total,
        inseridos: persistencia.inseridos,
        atualizados: persistencia.atualizados,
        naoAtualizados: persistencia.naoAtualizados,
        erros: persistencia.erros,
        orgaosJulgadoresCriados: persistencia.orgaosJulgadoresCriados,
      });

    } catch (error) {
      console.error('❌ Erro ao salvar audiências no banco:', error);
      // Não falha a captura se a persistência falhar - apenas loga o erro
    } finally {
      captureLogService.imprimirResumo();
      logsPersistencia = captureLogService.consumirLogs();
    }

    return {
      audiencias,
      total: audiencias.length,
      dataInicio,
      dataFim,
      persistencia,
      paginasBrutas: paginas,
      logs: logsPersistencia,
    };
  } finally {
    // 4. Limpar recursos (fechar navegador)
    if (authResult?.browser) {
      await authResult.browser.close();
    }
  }
}
