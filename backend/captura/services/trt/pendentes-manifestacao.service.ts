// Serviço específico para captura de processos pendentes de manifestação do TRT
// Usa API REST do PJE (não faz scraping HTML)

import { autenticarPJE, type AuthResult } from './trt-auth.service';
import type { CapturaPendentesManifestacaoParams } from './trt-capture.service';
import {
  obterTodosProcessosPendentesManifestacao,
  obterTotalizadoresPendentesManifestacao,
} from '@/backend/api/pje-trt';
import type { Processo } from '@/backend/types/pje-trt/types';
import { salvarPendentes, type SalvarPendentesResult, type ProcessoPendente } from '../persistence/pendentes-persistence.service';
import { buscarOuCriarAdvogadoPorCpf } from '@/backend/utils/captura/advogado-helper.service';
import { captureLogService } from '../persistence/capture-log.service';
import { downloadAndUploadDocumento } from '../pje/pje-expediente-documento.service';
import type { FetchDocumentoParams } from '@/backend/types/pje-trt/documento-types';

/**
 * Resultado da captura de processos pendentes de manifestação
 */
export interface PendentesManifestacaoResult {
  processos: Processo[];
  total: number;
  filtroPrazo?: 'no_prazo' | 'sem_prazo';
  persistencia?: SalvarPendentesResult;
  documentosCapturados?: number;
  documentosFalhados?: number;
  errosDocumentos?: string[];
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

    // 8. Capturar documentos PDF se solicitado
    let documentosCapturados = 0;
    let documentosFalhados = 0;
    const errosDocumentos: string[] = [];

    if (params.capturarDocumentos && persistencia) {
      console.log('\n📄 Iniciando captura de documentos...');
      console.log(`Total de pendentes para capturar documentos: ${processos.length}`);

      for (const processo of processos as ProcessoPendente[]) {
        // Verificar se o processo tem ID de documento
        if (!processo.idDocumento) {
          console.log(`⚠️ Pendente ${processo.numeroProcesso} não possui idDocumento, pulando...`);
          continue;
        }

        // Buscar ID do pendente no banco (necessário para atualização)
        // Usamos o id_pje para encontrar o registro inserido/atualizado
        try {
          const { data: pendenteDb } = await require('@/backend/utils/supabase/service-client')
            .createServiceClient()
            .from('pendentes_manifestacao')
            .select('id')
            .eq('id_pje', processo.id)
            .eq('trt', params.config.codigo)
            .eq('grau', params.config.grau)
            .eq('numero_processo', processo.numeroProcesso.trim())
            .single();

          if (!pendenteDb) {
            console.log(`⚠️ Pendente ${processo.numeroProcesso} não encontrado no banco, pulando...`);
            continue;
          }

          // Preparar parâmetros para captura de documento
          const documentoParams: FetchDocumentoParams = {
            processoId: String(processo.id),
            documentoId: String(processo.idDocumento),
            pendenteId: pendenteDb.id,
            numeroProcesso: processo.numeroProcesso,
            trt: params.config.codigo,
            grau: params.config.grau,
          };

          // Tentar capturar documento
          console.log(`\n📥 Capturando documento ${processo.idDocumento} do processo ${processo.numeroProcesso}...`);

          const resultado = await downloadAndUploadDocumento(authResult.page, documentoParams);

          if (resultado.success) {
            documentosCapturados++;
            console.log(`✅ Documento capturado: ${resultado.arquivoInfo?.arquivo_nome}`);
          } else {
            documentosFalhados++;
            const erro = `Pendente ${processo.numeroProcesso}: ${resultado.error}`;
            errosDocumentos.push(erro);
            console.error(`❌ ${erro}`);
          }

          // Delay de 500ms entre documentos para evitar sobrecarga da API PJE
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          documentosFalhados++;
          const erroMsg = error instanceof Error ? error.message : String(error);
          const erro = `Pendente ${processo.numeroProcesso}: ${erroMsg}`;
          errosDocumentos.push(erro);
          console.error(`❌ Erro ao capturar documento:`, error);
        }
      }

      console.log('\n📊 Resumo da captura de documentos:');
      console.log(`  ✅ Capturados: ${documentosCapturados}`);
      console.log(`  ❌ Falhados: ${documentosFalhados}`);
      if (errosDocumentos.length > 0) {
        console.log(`  📋 Erros:`);
        errosDocumentos.forEach((erro) => console.log(`    - ${erro}`));
      }
    }

    return {
      processos,
      total: processos.length,
      filtroPrazo,
      persistencia,
      documentosCapturados,
      documentosFalhados,
      errosDocumentos: errosDocumentos.length > 0 ? errosDocumentos : undefined,
    };
  } finally {
    // 7. Limpar recursos (fechar navegador)
    if (authResult?.browser) {
      await authResult.browser.close();
    }
  }
}
