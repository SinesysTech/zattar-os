// Serviço específico para captura de processos pendentes de manifestação do TRT
// Usa API REST do PJE (não faz scraping HTML)

import { autenticarPJE, type AuthResult } from './trt-auth.service';
import type { CapturaPendentesManifestacaoParams } from './trt-capture.service';
import {
  obterTodosProcessosPendentesManifestacao,
  obterTotalizadoresPendentesManifestacao,
  type Processo,
} from '@/backend/api/pje-trt/pendentes-manifestacao';
import { salvarPendentes, type SalvarPendentesResult, type ProcessoPendente } from '../persistence/pendentes-persistence.service';
import { buscarOuCriarAdvogadoPorCpf } from '../persistence/advogado-helper.service';
import { captureLogService } from '../persistence/capture-log.service';

/**
 * Resultado da captura de processos pendentes de manifestação
 */
export interface PendentesManifestacaoResult {
  processos: Processo[];
  total: number;
  filtroPrazo?: 'no_prazo' | 'sem_prazo';
  persistencia?: SalvarPendentesResult;
}

/**
 * Mapeamento de filtro de prazo para parâmetro da API
 */
const FILTRO_PRAZO_MAP: Record<'no_prazo' | 'sem_prazo', string> = {
  sem_prazo: 'I', // Expedientes sem prazo
  no_prazo: 'N',  // Expedientes no prazo
};

/**
 * Serviço de captura de processos pendentes de manifestação
 * 
 * Fluxo:
 * 1. Recebe parâmetros (TRT, grau, credenciais, filtroPrazo)
 * 2. Chama autenticação (autenticarPJE)
 * 3. Obtém idAdvogado do JWT (já extraído durante autenticação)
 * 4. Obtém totalizadores para validação
 * 5. Chama API REST para obter processos Pendentes de Manifestação com filtro de prazo
 * 6. Valida se quantidade obtida condiz com totalizador
 * 7. Retorna todos os processos (com paginação automática)
 * 8. Limpa recursos
 */
export async function pendentesManifestacaoCapture(
  params: CapturaPendentesManifestacaoParams
): Promise<PendentesManifestacaoResult> {
  let authResult: AuthResult | null = null;

  try {
    // 1. Autenticar no PJE
    authResult = await autenticarPJE({
      credential: params.credential,
      config: params.config,
      twofauthConfig: params.twofauthConfig,
      headless: true,
    });

    const { page, advogadoInfo } = authResult;

    // 2. Obter ID do advogado (já extraído do JWT durante autenticação)
    const idAdvogado = parseInt(advogadoInfo.idAdvogado, 10);
    
    if (isNaN(idAdvogado)) {
      throw new Error(`ID do advogado inválido: ${advogadoInfo.idAdvogado}`);
    }

    // 3. Obter totalizador de pendentes para validação
    const totalizadorPendentes = await obterTotalizadoresPendentesManifestacao(page, idAdvogado);

    // 4. Preparar parâmetros adicionais para filtro de prazo
    const filtroPrazo = params.filtroPrazo || 'sem_prazo'; // Default: sem prazo
    const agrupadorExpediente = FILTRO_PRAZO_MAP[filtroPrazo];

    const paramsAdicionais = {
      agrupadorExpediente,
      tipoPainelAdvogado: 2, // Pendentes de Manifestação
      idPainelAdvogadoEnum: 2, // Pendentes de Manifestação
      ordenacaoCrescente: false, // Mais recentes primeiro
    };

    // 5. Chamar API REST para obter processos Pendentes de Manifestação com filtro
    const processos = await obterTodosProcessosPendentesManifestacao(
      page,
      idAdvogado,
      500, // delayEntrePaginas
      paramsAdicionais
    );

    // 6. Validar se a quantidade raspada condiz com o totalizador
    // Nota: O totalizador pode não refletir o filtro de prazo, então validamos apenas se houver totalizador
    if (totalizadorPendentes) {
      const quantidadeEsperada = totalizadorPendentes.quantidadeProcessos;
      const quantidadeObtida = processos.length;

      // Se obtivemos mais processos que o totalizador, algo está errado
      if (quantidadeObtida > quantidadeEsperada) {
        throw new Error(
          `Quantidade de processos obtida (${quantidadeObtida}) excede o totalizador (${quantidadeEsperada}). A raspagem pode estar incorreta.`
        );
      }
      // Se obtivemos menos, pode ser normal devido ao filtro de prazo
    }

    // 7. Salvar processos pendentes no banco de dados
    let persistencia: SalvarPendentesResult | undefined;
    try {
      const advogadoDb = await buscarOuCriarAdvogadoPorCpf(
        advogadoInfo.cpf,
        advogadoInfo.nome
      );

      persistencia = await salvarPendentes({
        processos: processos as ProcessoPendente[],
        advogadoId: advogadoDb.id,
        trt: params.config.codigo,
        grau: params.config.grau,
      });

      console.log('✅ Processos pendentes salvos no banco:', {
        total: persistencia.total,
        inseridos: persistencia.inseridos,
        atualizados: persistencia.atualizados,
        naoAtualizados: persistencia.naoAtualizados,
        erros: persistencia.erros,
      });

      // Imprimir resumo dos logs
      captureLogService.imprimirResumo();
    } catch (error) {
      console.error('❌ Erro ao salvar processos pendentes no banco:', error);
      // Não falha a captura se a persistência falhar - apenas loga o erro
    }

    return {
      processos,
      total: processos.length,
      filtroPrazo,
      persistencia,
    };
  } finally {
    // 7. Limpar recursos (fechar navegador)
    if (authResult?.browser) {
      await authResult.browser.close();
    }
  }
}
