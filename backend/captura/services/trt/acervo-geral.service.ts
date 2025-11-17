// Serviço específico para captura de acervo geral do TRT
// Usa API REST do PJE (não faz scraping HTML)

import { autenticarPJE, type AuthResult } from './trt-auth.service';
import type { CapturaTRTParams } from './trt-capture.service';
import {
  obterTodosProcessosAcervoGeral,
  obterTotalizadoresAcervoGeral,
} from '@/backend/api/pje-trt/acervo-geral';
import type { Processo } from '@/backend/types/pje-trt/types';
import { salvarAcervo, type SalvarAcervoResult } from '../persistence/acervo-persistence.service';
import { buscarOuCriarAdvogadoPorCpf } from '@/backend/utils/captura/advogado-helper.service';
import { captureLogService } from '../persistence/capture-log.service';

/**
 * Resultado da captura de acervo geral
 */
export interface AcervoGeralResult {
  processos: Processo[];
  total: number;
  persistencia?: SalvarAcervoResult;
}

/**
 * Serviço de captura de acervo geral
 * 
 * Fluxo:
 * 1. Recebe parâmetros (TRT, grau, credenciais)
 * 2. Chama autenticação (autenticarPJE)
 * 3. Obtém idAdvogado do JWT (já extraído durante autenticação)
 * 4. Obtém totalizadores para validação
 * 5. Chama API REST para obter processos do Acervo Geral
 * 6. Valida se quantidade obtida condiz com totalizador
 * 7. Retorna todos os processos (com paginação automática)
 * 8. Limpa recursos
 */
export async function acervoGeralCapture(
  params: CapturaTRTParams
): Promise<AcervoGeralResult> {
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

    // 3. Obter totalizador de acervo geral para validação
    const totalizadorAcervoGeral = await obterTotalizadoresAcervoGeral(page, idAdvogado);

    // 4. Chamar API REST para obter processos do Acervo Geral
    const processos = await obterTodosProcessosAcervoGeral(page, idAdvogado);

    // 5. Validar se a quantidade raspada condiz com o totalizador
    if (totalizadorAcervoGeral) {
      const quantidadeEsperada = totalizadorAcervoGeral.quantidadeProcessos;
      const quantidadeObtida = processos.length;

      if (quantidadeObtida !== quantidadeEsperada) {
        throw new Error(
          `Quantidade de processos obtida (${quantidadeObtida}) não condiz com o totalizador (${quantidadeEsperada}). A raspagem pode estar incompleta.`
        );
      }
    }

    // 6. Salvar processos no banco de dados
    let persistencia: SalvarAcervoResult | undefined;
    try {
      const advogadoDb = await buscarOuCriarAdvogadoPorCpf(
        advogadoInfo.cpf,
        advogadoInfo.nome
      );

      persistencia = await salvarAcervo({
        processos,
        advogadoId: advogadoDb.id,
        origem: 'acervo_geral',
        trt: params.config.codigo,
        grau: params.config.grau,
      });

      console.log('✅ Processos salvos no banco:', {
        total: persistencia.total,
        inseridos: persistencia.inseridos,
        atualizados: persistencia.atualizados,
        naoAtualizados: persistencia.naoAtualizados,
        erros: persistencia.erros,
      });

      // Imprimir resumo dos logs
      captureLogService.imprimirResumo();
    } catch (error) {
      console.error('❌ Erro ao salvar processos no banco:', error);
      // Não falha a captura se a persistência falhar - apenas loga o erro
    }

    return {
      processos,
      total: processos.length,
      persistencia,
    };
  } finally {
    // 4. Limpar recursos (fechar navegador)
    if (authResult?.browser) {
      await authResult.browser.close();
    }
  }
}
