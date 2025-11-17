// Serviço específico para captura de processos arquivados do TRT
// Usa API REST do PJE (não faz scraping HTML)

import { autenticarPJE, type AuthResult } from './trt-auth.service';
import type { CapturaTRTParams } from './trt-capture.service';
import {
  obterTodosProcessosArquivados,
} from '@/backend/api/pje-trt/arquivados';
import type { Processo } from '@/backend/types/pje-trt/types';
import { salvarAcervo, type SalvarAcervoResult } from '../persistence/acervo-persistence.service';
import { buscarOuCriarAdvogadoPorCpf } from '@/backend/utils/captura/advogado-helper.service';
import { captureLogService } from '../persistence/capture-log.service';

/**
 * Resultado da captura de processos arquivados
 */
export interface ArquivadosResult {
  processos: Processo[];
  total: number;
  persistencia?: SalvarAcervoResult;
}

/**
 * Serviço de captura de processos arquivados
 * 
 * Fluxo:
 * 1. Recebe parâmetros (TRT, grau, credenciais)
 * 2. Chama autenticação (autenticarPJE)
 * 3. Obtém idAdvogado do JWT
 * 4. Prepara parâmetros específicos para arquivados (tipoPainelAdvogado=5, ordenacaoCrescente=false, data=timestamp)
 * 5. Chama API REST para obter processos Arquivados
 * 6. Retorna todos os processos (com paginação automática)
 * 7. Limpa recursos
 */
export async function arquivadosCapture(
  params: CapturaTRTParams
): Promise<ArquivadosResult> {
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

    // 3. Preparar parâmetros adicionais para a API de processos arquivados
    // tipoPainelAdvogado=5 identifica Arquivados
    // ordenacaoCrescente=false = mais recentes primeiro
    // data=timestamp atual (para cache/controle de versão)
    const paramsAdicionais: Record<string, string | number | boolean> = {
      tipoPainelAdvogado: 5,
      ordenacaoCrescente: false,
      data: Date.now(), // Timestamp atual
    };

    // 4. Chamar API REST para obter processos Arquivados
    const processos = await obterTodosProcessosArquivados(
      page,
      idAdvogado,
      500, // delayEntrePaginas
      paramsAdicionais
    );

    // 5. Salvar processos no banco de dados
    let persistencia: SalvarAcervoResult | undefined;
    try {
      const advogadoDb = await buscarOuCriarAdvogadoPorCpf(
        advogadoInfo.cpf,
        advogadoInfo.nome
      );

      persistencia = await salvarAcervo({
        processos,
        advogadoId: advogadoDb.id,
        origem: 'arquivado',
        trt: params.config.codigo,
        grau: params.config.grau,
      });

      console.log('✅ Processos arquivados salvos no banco:', {
        total: persistencia.total,
        inseridos: persistencia.inseridos,
        atualizados: persistencia.atualizados,
        naoAtualizados: persistencia.naoAtualizados,
        erros: persistencia.erros,
      });

      // Imprimir resumo dos logs
      captureLogService.imprimirResumo();
    } catch (error) {
      console.error('❌ Erro ao salvar processos arquivados no banco:', error);
      // Não falha a captura se a persistência falhar - apenas loga o erro
    }

    return {
      processos,
      total: processos.length,
      persistencia,
    };
  } finally {
    // 5. Limpar recursos (fechar navegador)
    if (authResult?.browser) {
      await authResult.browser.close();
    }
  }
}
