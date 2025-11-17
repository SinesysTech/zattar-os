// Rota de API para captura de processos arquivados do TRT

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { getCredentialByTribunalAndGrau } from '@/backend/captura/credentials/credential.service';
import { arquivadosCapture } from '@/backend/captura/services/trt/arquivados.service';
import { getTribunalConfig } from '@/backend/captura/services/trt/config';
import type { BaseCapturaTRTParams } from '@/backend/types/captura/trt-types';

/**
 * @swagger
 * /api/captura/trt/arquivados:
 *   post:
 *     summary: Captura processos arquivados do TRT
 *     description: |
 *       Realiza a captura de processos arquivados do PJE/TRT usando credenciais armazenadas no banco de dados.
 *       
 *       Este endpoint:
 *       - Autentica no PJE usando as credenciais fornecidas
 *       - Obtém todos os processos arquivados do advogado
 *       - Retorna os processos com paginação automática
 *       - Salva os dados no banco de dados automaticamente
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
 *             $ref: '#/components/schemas/BaseCapturaTRTParams'
 *           example:
 *             advogado_id: 1
 *             trt_codigo: "TRT3"
 *             grau: "primeiro_grau"
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
 *                     processos:
 *                       type: array
 *                       description: Lista de processos arquivados
 *                       items:
 *                         type: object
 *                     total:
 *                       type: integer
 *                       description: Total de processos capturados
 *                       example: 150
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
 *       400:
 *         description: Parâmetros obrigatórios ausentes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Missing required parameters: advogado_id, trt_codigo, grau"
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
 *               error: "Credential not found for this advogado_id, trt_codigo and grau combination"
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
    const { advogado_id, trt_codigo, grau } = body as BaseCapturaTRTParams;

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
    const resultado = await arquivadosCapture({
      credential,
      config: tribunalConfig,
    });

    // 6. Retornar resultado (credenciais já foram limpas da memória)
    return NextResponse.json({
      success: true,
      data: resultado,
    });

  } catch (error) {
    console.error('Error in arquivados capture:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
