// Rota de API para captura de acervo geral do TRT
// Exemplo de estrutura segura (sem credenciais na requisição)

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { getCredentialComplete } from '@/backend/captura/credentials/credential.service';
import { acervoGeralCapture } from '@/backend/captura/services/trt/acervo-geral.service';
import { getTribunalConfig } from '@/backend/captura/services/trt/config';

/**
 * @swagger
 * /api/captura/trt/acervo-geral:
 *   post:
 *     summary: Captura dados do acervo geral do TRT
 *     description: Realiza a captura de processos do acervo geral do PJE/TRT usando credenciais armazenadas no banco de dados
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
 *             type: object
 *             required:
 *               - advogado_id
 *               - credencial_ids
 *             properties:
 *               advogado_id:
 *                 type: integer
 *                 description: ID do advogado
 *               credencial_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array de IDs das credenciais a serem utilizadas na captura
 *           example:
 *             advogado_id: 1
 *             credencial_ids: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Captura iniciada com sucesso (resposta assíncrona)
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
 *                   example: "Captura iniciada com sucesso"
 *                 status:
 *                   type: string
 *                   enum: [in_progress]
 *                   example: "in_progress"
 *                 data:
 *                   type: object
 *                   properties:
 *                     credenciais_processadas:
 *                       type: integer
 *                       description: Número de credenciais processadas
 *                     resultados:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           credencial_id:
 *                             type: integer
 *                           tribunal:
 *                             type: string
 *                           grau:
 *                             type: string
 *                           resultado:
 *                             type: object
 *                             description: Resultado da captura para esta credencial
 *                           erro:
 *                             type: string
 *                             description: Mensagem de erro se a captura falhou
 *       400:
 *         description: Parâmetros obrigatórios ausentes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Missing required parameters: advogado_id, credencial_ids"
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
 *               error: "One or more credentials not found"
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
    const { advogado_id, credencial_ids } = body as {
      advogado_id: number;
      credencial_ids: number[];
    };

    // Validações básicas
    if (!advogado_id || !credencial_ids || !Array.isArray(credencial_ids) || credencial_ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing required parameters: advogado_id, credencial_ids (array não vazio)' },
        { status: 400 }
      );
    }

    // 3. Buscar credenciais completas por IDs
    const credenciaisCompletas = await Promise.all(
      credencial_ids.map((id) => getCredentialComplete(id))
    );

    // Verificar se todas as credenciais foram encontradas
    const credenciaisNaoEncontradas = credenciaisCompletas
      .map((cred, index) => (!cred ? credencial_ids[index] : null))
      .filter((id): id is number => id !== null);

    if (credenciaisNaoEncontradas.length > 0) {
      return NextResponse.json(
        {
          error: 'One or more credentials not found',
          details: {
            credencial_ids_nao_encontradas: credenciaisNaoEncontradas,
            message: 'Verifique se todas as credenciais existem e estão ativas',
          },
        },
        { status: 404 }
      );
    }

    // Verificar se todas as credenciais pertencem ao advogado
    const credenciaisInvalidas = credenciaisCompletas
      .map((cred, index) => (cred && cred.advogadoId !== advogado_id ? credencial_ids[index] : null))
      .filter((id): id is number => id !== null);

    if (credenciaisInvalidas.length > 0) {
      return NextResponse.json(
        {
          error: 'One or more credentials do not belong to the specified advogado',
          details: {
            credencial_ids_invalidas: credenciaisInvalidas,
            advogado_id,
          },
        },
        { status: 400 }
      );
    }

    // 4. Processar cada credencial
    const resultados = await Promise.all(
      credenciaisCompletas.map(async (credCompleta) => {
        if (!credCompleta) return null;

        // Buscar configuração do tribunal
        const tribunalConfig = getTribunalConfig(credCompleta.tribunal, credCompleta.grau);
        if (!tribunalConfig) {
          console.error(`Tribunal configuration not found for ${credCompleta.tribunal} ${credCompleta.grau}`);
          return null;
        }

        // Executar captura
        try {
          const resultado = await acervoGeralCapture({
            credential: credCompleta.credenciais,
            config: tribunalConfig,
          });

          return {
            credencial_id: credCompleta.credentialId,
            tribunal: credCompleta.tribunal,
            grau: credCompleta.grau,
            resultado,
          };
        } catch (error) {
          console.error(`Erro ao capturar para credencial ${credCompleta.credentialId}:`, error);
          return {
            credencial_id: credCompleta.credentialId,
            tribunal: credCompleta.tribunal,
            grau: credCompleta.grau,
            erro: error instanceof Error ? error.message : 'Erro desconhecido',
          };
        }
      })
    );

    // 5. Retornar resultado (resposta assíncrona)
    return NextResponse.json({
      success: true,
      message: 'Captura iniciada com sucesso',
      status: 'in_progress',
      data: {
        credenciais_processadas: resultados.length,
        resultados,
      },
    });

  } catch (error) {
    console.error('Error in acervo-geral capture:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
