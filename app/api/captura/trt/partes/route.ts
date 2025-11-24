// Rota de API para captura de partes de processos do PJE-TRT
// Captura partes, representantes e cria vínculos processo-partes

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { getCredentialComplete } from '@/backend/captura/credentials/credential.service';
import { getTribunalConfig } from '@/backend/captura/services/trt/config';
import { iniciarCapturaLog, finalizarCapturaLogSucesso, finalizarCapturaLogErro } from '@/backend/captura/services/captura-log.service';
import { capturarPartesProcesso, type ProcessoParaCaptura } from '@/backend/captura/services/partes/partes-capture.service';
import { autenticarPJE } from '@/backend/captura/services/trt/trt-auth.service';
import { buscarAdvogado } from '@/backend/advogados/services/persistence/advogado-persistence.service';
import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type { CodigoTRT, GrauTRT } from '@/backend/types/captura/trt-types';

const GRAUS_VALIDOS: GrauTRT[] = ['primeiro_grau', 'segundo_grau', 'tribunal_superior'];

function isCodigoTRT(value: unknown): value is CodigoTRT {
  return typeof value === 'string' && /^TRT([1-9]|1[0-9]|2[0-4])$/.test(value);
}

function isGrauTRT(value: unknown): value is GrauTRT {
  return typeof value === 'string' && GRAUS_VALIDOS.includes(value as GrauTRT);
}

function sanitizeNumeroProcesso(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const sanitized = value.trim().replace(/\s+/g, '');
  return sanitized.length > 0 ? sanitized : undefined;
}

function sanitizeListaNumerosProcesso(value: unknown): string[] {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  const numeros = list
    .map((n) => (typeof n === 'string' ? n.trim() : ''))
    .map((n) => n.replace(/\s+/g, ''))
    .filter((n) => n.length > 0);
  return Array.from(new Set(numeros));
}

/**
 * @swagger
 * /api/captura/trt/partes:
 *   post:
 *     summary: Captura partes (pessoas envolvidas) de processos do PJE-TRT
 *     description: |
 *       Captura todas as partes de processos específicos ou de todos os processos de um advogado.
 *       Para cada parte:
 *       - Identifica se é cliente, parte contrária ou terceiro (baseado em CPF de representantes)
 *       - Faz upsert na tabela apropriada (clientes, partes_contrarias ou terceiros)
 *       - Salva representantes legais (advogados, defensores, etc.)
 *       - Cria vínculo processo-parte na tabela processo_partes
 *       - Permite filtrar processos por IDs, TRTs, graus ou números de processo (único ou múltiplos)
 *     tags:
 *       - Captura TRT
 *       - Partes
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - advogado_id
 *               - credencial_ids
 *             properties:
 *               advogado_id:
 *                 type: integer
 *                 description: ID do advogado (usado para identificar clientes por CPF)
 *               credencial_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array de IDs das credenciais para autenticação no PJE
 *               processo_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array de IDs dos processos (opcional - se vazio, captura todos os processos do advogado)
 *               trts:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de códigos TRT (ex: TRT3) para filtrar processos
 *               graus:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [primeiro_grau, segundo_grau]
 *                 description: Lista de graus para filtrar processos
 *               numero_processo:
 *                 type: string
 *                 description: Número específico de processo para captura
 *               numeros_processo:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de números de processos (um por item)
 *           example:
 *             advogado_id: 1
 *             credencial_ids: [5, 6]
 *             processo_ids: [100, 101, 102]
 *             trts: ['TRT3', 'TRT5']
 *             graus: ['primeiro_grau']
 *     responses:
 *       200:
 *         description: Captura concluída com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Captura de partes concluída"
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_processos:
 *                       type: integer
 *                       description: Quantidade de processos processados
 *                     total_partes:
 *                       type: integer
 *                       description: Total de partes encontradas
 *                     clientes:
 *                       type: integer
 *                       description: Quantidade de clientes identificados
 *                     partes_contrarias:
 *                       type: integer
 *                       description: Quantidade de partes contrárias
 *                     terceiros:
 *                       type: integer
 *                       description: Quantidade de terceiros (peritos, MP, etc.)
 *                     representantes:
 *                       type: integer
 *                       description: Total de representantes salvos
 *                     vinculos:
 *                       type: integer
 *                       description: Total de vínculos processo-parte criados
 *                     erros:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           processo_id:
 *                             type: integer
 *                           numero_processo:
 *                             type: string
 *                           erro:
 *                             type: string
 *                       description: Lista de erros ocorridos
 *                     duracao_ms:
 *                       type: integer
 *                       description: Tempo total de execução em milissegundos
 *       400:
 *         description: Parâmetros obrigatórios ausentes ou inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Missing required parameters: advogado_id, credencial_ids"
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Unauthorized"
 *       404:
 *         description: Advogado, credencial ou processo não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Advogado não encontrado"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Internal server error"
 */
export async function POST(request: NextRequest) {
  const capturaLogId = null; // Será preenchido ao criar log de captura

  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Validar e parsear body da requisição
    const body = await request.json();
    const {
      advogado_id,
      credencial_ids,
      processo_ids,
      trts,
      graus,
      numero_processo,
      numeros_processo,
    } = body as {
      advogado_id: number;
      credencial_ids: number[];
      processo_ids?: number[];
      trts?: CodigoTRT[];
      graus?: GrauTRT[];
      numero_processo?: string;
      numeros_processo?: string[];
    };

    // Validações básicas
    if (!advogado_id || !credencial_ids || !Array.isArray(credencial_ids) || credencial_ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing required parameters: advogado_id, credencial_ids (array não vazio)' },
        { status: 400 }
      );
    }

    // 3. Buscar advogado
    const advogado = await buscarAdvogado(advogado_id);
    if (!advogado) {
      return NextResponse.json(
        { error: `Advogado não encontrado` },
        { status: 404 }
      );
    }

    // 4. Buscar credenciais completas por IDs
    const credenciais = [];
    for (const id of credencial_ids) {
      const credencial = await getCredentialComplete(id);
      if (!credencial) {
        return NextResponse.json(
          { error: `Credencial ${id} não encontrada` },
          { status: 404 }
        );
      }
      credenciais.push(credencial);
    }

    if (credenciais.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma credencial válida encontrada' },
        { status: 404 }
      );
    }

    // Sanitizar filtros opcionais
    const trtsFiltrados = Array.isArray(trts) ? trts.filter(isCodigoTRT) : [];
    const grausFiltrados = Array.isArray(graus) ? graus.filter(isGrauTRT) : [];
    const numeroProcessoUnico = sanitizeNumeroProcesso(numero_processo);
    const numerosProcessoLista = sanitizeListaNumerosProcesso(numeros_processo);
    const numerosParaFiltro = new Set<string>(numerosProcessoLista);
    if (numeroProcessoUnico) {
      numerosParaFiltro.add(numeroProcessoUnico);
    }
    const numerosFiltroArray = Array.from(numerosParaFiltro);

    if (
      (!processo_ids || processo_ids.length === 0) &&
      trtsFiltrados.length === 0 &&
      grausFiltrados.length === 0 &&
      numerosFiltroArray.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            'É necessário informar pelo menos um filtro: processo_ids, numero_processo, numeros_processo, trts ou graus',
        },
        { status: 400 }
      );
    }

    // 5. Buscar processos com base nos filtros fornecidos
    let processos: ProcessoParaCaptura[] = [];

    const supabase = createServiceClient();
    let processosQuery = supabase
      .from('acervo')
      .select('id, numero_processo, id_pje, trt, grau');

    if (processo_ids && processo_ids.length > 0) {
      processosQuery = processosQuery.in('id', processo_ids);
    }
    if (numerosFiltroArray.length > 0) {
      processosQuery = processosQuery.in('numero_processo', numerosFiltroArray);
    }
    if (trtsFiltrados.length > 0) {
      processosQuery = processosQuery.in('trt', trtsFiltrados);
    }
    if (grausFiltrados.length > 0) {
      processosQuery = processosQuery.in('grau', grausFiltrados);
    }

    const { data: processosData, error: processosError } = await processosQuery;

    if (processosError || !processosData || processosData.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum processo encontrado com os filtros fornecidos' },
        { status: 404 }
      );
    }

    processos = processosData.map((p: any) => ({
      id: p.id,
      numero_processo: p.numero_processo,
      id_pje: p.id_pje,
      trt: p.trt,
      grau: p.grau,
    }));

    // 6. Iniciar log de captura
    // const capturaLogId = await iniciarCapturaLog({
    //   tipo_captura: 'partes',
    //   usuario_id: authResult.userId,
    //   credencial_id: credenciais[0].credencial_id,
    // });

    // 7. Resultado agregado de todos os processos
    const resultadoTotal = {
      total_processos: processos.length,
      total_partes: 0,
      clientes: 0,
      partes_contrarias: 0,
      terceiros: 0,
      representantes: 0,
      vinculos: 0,
      erros: [] as Array<{ processo_id: number; numero_processo: string; erro: string }>,
      duracao_ms: 0,
    };

    const inicio = Date.now();

    // 8. Processar cada processo
    for (const processo of processos) {
      try {
        console.log(`[API-PARTES] Processando processo ${processo.numero_processo}`);

        // Encontra credencial do mesmo TRT do processo
        const credencial = credenciais.find(c => c.tribunal === processo.trt);

        if (!credencial) {
          console.warn(`[API-PARTES] Nenhuma credencial encontrada para TRT${processo.trt}, pulando processo ${processo.numero_processo}`);
          resultadoTotal.erros.push({
            processo_id: processo.id,
            numero_processo: processo.numero_processo,
            erro: `Nenhuma credencial disponível para TRT${processo.trt}`,
          });
          continue;
        }

        // Buscar configuração do tribunal
        const config = await getTribunalConfig(credencial.tribunal, credencial.grau);

        // Autenticar no PJE
        const { page } = await autenticarPJE({
          credential: credencial.credenciais,
          config,
          twofauthConfig: credencial.credenciais.cpf ? { accountId: credencial.credenciais.cpf } : undefined,
        });

        // Capturar partes do processo
        const resultado = await capturarPartesProcesso(page, processo, {
          id: advogado.id,
          cpf: advogado.cpf,
        });

        // Agregar resultados
        resultadoTotal.total_partes += resultado.totalPartes;
        resultadoTotal.clientes += resultado.clientes;
        resultadoTotal.partes_contrarias += resultado.partesContrarias;
        resultadoTotal.terceiros += resultado.terceiros;
        resultadoTotal.representantes += resultado.representantes;
        resultadoTotal.vinculos += resultado.vinculos;

        // Agregar erros
        if (resultado.erros.length > 0) {
          for (const erro of resultado.erros) {
            resultadoTotal.erros.push({
              processo_id: processo.id,
              numero_processo: processo.numero_processo,
              erro: erro.erro,
            });
          }
        }

        // Fechar página
        await page.close();

        console.log(`[API-PARTES] Processo ${processo.numero_processo} concluído: ${resultado.totalPartes} partes`);
      } catch (error) {
        console.error(`[API-PARTES] Erro ao processar processo ${processo.numero_processo}:`, error);

        resultadoTotal.erros.push({
          processo_id: processo.id,
          numero_processo: processo.numero_processo,
          erro: error instanceof Error ? error.message : String(error),
        });
      }
    }

    resultadoTotal.duracao_ms = Date.now() - inicio;

    // 9. Finalizar log de captura
    // if (capturaLogId) {
    //   await finalizarCapturaLogSucesso(capturaLogId, resultadoTotal);
    // }

    // 10. Retornar resultado
    return NextResponse.json({
      success: true,
      message: 'Captura de partes concluída',
      data: resultadoTotal,
    });

  } catch (error) {
    console.error('[API-PARTES] Erro na captura:', error);

    // Finalizar log com erro se foi iniciado
    // if (capturaLogId) {
    //   await finalizarCapturaLogErro(capturaLogId, error instanceof Error ? error.message : String(error));
    // }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
