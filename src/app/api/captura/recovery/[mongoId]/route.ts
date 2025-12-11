/**
 * API de Recuperação de Capturas - Detalhe
 * GET: Buscar log específico por MongoDB ID com análise de gaps
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { buscarLogPorMongoId } from '@/features/captura/services/recovery/captura-recovery.service';
import { analisarCaptura } from '@/features/captura/services/recovery/recovery-analysis.service';

type RouteParams = {
  params: Promise<{
    mongoId: string;
  }>;
};

/**
 * @swagger
 * /api/captura/recovery/{mongoId}:
 *   get:
 *     summary: Busca detalhes de um log de captura por MongoDB ID
 *     description: |
 *       Retorna os detalhes completos de um log de captura específico do MongoDB,
 *       incluindo análise de gaps (elementos faltantes no PostgreSQL).
 *     tags:
 *       - Recovery
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: path
 *         name: mongoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do documento no MongoDB (ObjectId)
 *       - in: query
 *         name: incluir_payload
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir payload bruto completo na resposta
 *       - in: query
 *         name: analisar_gaps
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Realizar análise de gaps (pode ser lento para payloads grandes)
 *     responses:
 *       200:
 *         description: Log encontrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     log:
 *                       type: object
 *                       properties:
 *                         mongoId:
 *                           type: string
 *                         capturaLogId:
 *                           type: integer
 *                         tipoCaptura:
 *                           type: string
 *                         status:
 *                           type: string
 *                         trt:
 *                           type: string
 *                         grau:
 *                           type: string
 *                         advogadoId:
 *                           type: integer
 *                         criadoEm:
 *                           type: string
 *                           format: date-time
 *                         erro:
 *                           type: string
 *                     analise:
 *                       type: object
 *                       description: Análise de gaps (se analisar_gaps=true)
 *                       properties:
 *                         processo:
 *                           type: object
 *                         totais:
 *                           type: object
 *                         gaps:
 *                           type: object
 *                           properties:
 *                             enderecosFaltantes:
 *                               type: array
 *                             partesFaltantes:
 *                               type: array
 *                             representantesFaltantes:
 *                               type: array
 *                     payloadDisponivel:
 *                       type: boolean
 *                     payloadBruto:
 *                       type: object
 *                       description: Incluído se incluir_payload=true
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Log não encontrado
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // 2. Obter parâmetros
    const { mongoId } = await params;

    if (!mongoId || mongoId.length !== 24) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'MongoDB ID inválido' } },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const incluirPayload = searchParams.get('incluir_payload') === 'true';
    const analisarGaps = searchParams.get('analisar_gaps') !== 'false'; // default: true

    // 3. Buscar log
    const documento = await buscarLogPorMongoId(mongoId);

    if (!documento) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Log não encontrado' } },
        { status: 404 }
      );
    }

    // 4. Preparar resposta base
    const logInfo = {
      mongoId: documento._id!.toString(),
      capturaLogId: documento.captura_log_id,
      tipoCaptura: documento.tipo_captura,
      status: documento.status,
      trt: documento.trt,
      grau: documento.grau,
      advogadoId: documento.advogado_id,
      credencialId: documento.credencial_id,
      criadoEm: documento.criado_em,
      atualizadoEm: documento.atualizado_em,
      requisicao: documento.requisicao,
      resultadoProcessado: documento.resultado_processado,
      logs: documento.logs,
      erro: documento.erro,
    };

    // 5. Analisar gaps se solicitado
    let analise = null;
    if (analisarGaps) {
      analise = await analisarCaptura(mongoId);
    }

    // 6. Montar resposta
    const response: Record<string, unknown> = {
      success: true,
      data: {
        log: logInfo,
        payloadDisponivel:
          documento.payload_bruto !== null && documento.payload_bruto !== undefined,
      },
    };

    if (analise) {
      response.data = {
        ...(response.data as object),
        analise: {
          processo: analise.processo,
          totais: analise.totais,
          gaps: analise.gaps,
          payloadDisponivel: analise.payloadDisponivel,
          erroOriginal: analise.erroOriginal,
        },
      };
    }

    if (incluirPayload && documento.payload_bruto) {
      response.data = {
        ...(response.data as object),
        payloadBruto: documento.payload_bruto,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao buscar log de recovery:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: erroMsg } },
      { status: 500 }
    );
  }
}

