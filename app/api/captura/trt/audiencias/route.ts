// Rota de API para captura de audiências do TRT

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { getCredentialByTribunalAndGrau } from '@/backend/captura/credentials/credential.service';
import { audienciasCapture } from '@/backend/captura/services/trt/audiencias.service';
import { getTribunalConfig } from '@/backend/captura/services/trt/config';
import type { BaseCapturaTRTParams } from '@/backend/types/captura/trt-types';

interface AudienciasParams extends BaseCapturaTRTParams {
  dataInicio?: string;
  dataFim?: string;
}

/**
 * @swagger
 * /api/captura/trt/audiencias:
 *   post:
 *     summary: Captura audiências do TRT
 *     description: |
 *       Realiza a captura de audiências marcadas/designadas do PJE/TRT usando credenciais armazenadas no banco de dados.
 *       
 *       Este endpoint:
 *       - Autentica no PJE usando as credenciais fornecidas
 *       - Busca audiências no período especificado (ou usa padrão: hoje até +365 dias)
 *       - Retorna todas as audiências com paginação automática
 *       - Salva os dados no banco de dados automaticamente
 *       
 *       **Comportamento das datas:**
 *       - Se `dataInicio` não fornecida: usa a data de hoje
 *       - Se `dataFim` não fornecida: usa hoje + 365 dias
 *       - Se ambas fornecidas: usa as datas fornecidas
 *       - Formato das datas: YYYY-MM-DD
 *     tags:
 *       - Captura TRT
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AudienciasParams'
 *           example:
 *             advogado_id: 1
 *             trt_codigo: "TRT3"
 *             grau: "primeiro_grau"
 *             dataInicio: "2024-01-01"
 *             dataFim: "2024-12-31"
 *     responses:
 *       200:
 *         description: Captura realizada com sucesso
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
 *                     audiencias:
 *                       type: array
 *                       description: Lista de audiências capturadas
 *                       items:
 *                         type: object
 *                     total:
 *                       type: integer
 *                       description: Total de audiências capturadas
 *                       example: 45
 *                     dataInicio:
 *                       type: string
 *                       format: date
 *                       description: Data inicial do período de busca utilizada
 *                       example: "2024-01-01"
 *                     dataFim:
 *                       type: string
 *                       format: date
 *                       description: Data final do período de busca utilizada
 *                       example: "2024-12-31"
 *                     persistencia:
 *                       type: object
 *                       description: Informações sobre a persistência no banco de dados
 *                       properties:
 *                         total:
 *                           type: integer
 *                         atualizados:
 *                           type: integer
 *                         erros:
 *                           type: integer
 *                         orgaosJulgadoresCriados:
 *                           type: integer
 *       400:
 *         description: Parâmetros inválidos ou formato de data incorreto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingParams:
 *                 value:
 *                   error: "Missing required parameters: advogado_id, trt_codigo, grau"
 *               invalidDate:
 *                 value:
 *                   error: "Formato de dataInicio inválido: 2024/01/01. Use formato YYYY-MM-DD."
 *               dateRange:
 *                 value:
 *                   error: "dataInicio (2024-12-31) não pode ser posterior a dataFim (2024-01-01)."
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Unauthorized"
 *       404:
 *         description: Credencial ou configuração não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Credential not found or access denied"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Internal server error"
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação (Supabase Auth ou Bearer Token)
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Validar e parsear body da requisição
    const body = await request.json();
    const { advogado_id, trt_codigo, grau, dataInicio, dataFim } = body as AudienciasParams;

    // Validações básicas
    if (!advogado_id || !trt_codigo || !grau) {
      return NextResponse.json(
        { error: 'Missing required parameters: advogado_id, trt_codigo, grau' },
        { status: 400 }
      );
    }

    // Validar grau
    if (grau !== 'primeiro_grau' && grau !== 'segundo_grau') {
      return NextResponse.json(
        { error: 'Invalid grau. Must be "primeiro_grau" or "segundo_grau"' },
        { status: 400 }
      );
    }

    // 3. Buscar credencial do banco usando advogado_id, TRT e grau
    const credential = await getCredentialByTribunalAndGrau({
      advogadoId: advogado_id,
      tribunal: trt_codigo,
      grau,
    });

    if (!credential) {
      return NextResponse.json(
        { 
          error: 'Credential not found for this advogado_id, trt_codigo and grau combination',
          details: {
            advogado_id: advogado_id,
            trt_codigo,
            grau,
            message: 'Verifique se existe uma credencial ativa para este advogado, TRT e grau no banco de dados'
          }
        },
        { status: 404 }
      );
    }

    // 4. Buscar configuração do tribunal
    const tribunalConfig = getTribunalConfig(trt_codigo, grau);
    if (!tribunalConfig) {
      return NextResponse.json(
        { error: 'Tribunal configuration not found' },
        { status: 404 }
      );
    }

    // 5. Executar captura (credenciais descriptografadas em memória)
    const resultado = await audienciasCapture({
      credential,
      config: tribunalConfig,
      dataInicio,
      dataFim,
    });

    // 6. Retornar resultado (credenciais já foram limpas da memória)
    return NextResponse.json({
      success: true,
      data: resultado,
    });

  } catch (error) {
    console.error('Error in audiencias capture:', error);
    
    // Retornar erro específico se for erro de validação
    if (error instanceof Error && error.message.includes('Formato de data') || error.message.includes('não pode ser posterior')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
