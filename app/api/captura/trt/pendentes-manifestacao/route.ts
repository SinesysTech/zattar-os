// Rota de API para captura de processos pendentes de manifestação do TRT

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { getCredentialByTribunalAndGrau } from '@/backend/captura/credentials/credential.service';
import { pendentesManifestacaoCapture } from '@/backend/captura/services/trt/pendentes-manifestacao.service';
import { getTribunalConfig } from '@/backend/captura/services/trt/config';
import type { BaseCapturaTRTParams, FiltroPrazoPendentes } from '@/backend/types/captura/trt-types';

interface PendentesManifestacaoParams extends BaseCapturaTRTParams {
  filtroPrazo?: FiltroPrazoPendentes;
}

/**
 * @swagger
 * /api/captura/trt/pendentes-manifestacao:
 *   post:
 *     summary: Captura processos pendentes de manifestação do TRT
 *     description: |
 *       Realiza a captura de processos pendentes de manifestação do PJE/TRT usando credenciais armazenadas no banco de dados.
 *       
 *       Este endpoint:
 *       - Autentica no PJE usando as credenciais fornecidas
 *       - Obtém totalizadores para validação
 *       - Filtra processos por prazo (no prazo ou sem prazo)
 *       - Retorna todos os processos com paginação automática
 *       - Valida a quantidade obtida contra os totalizadores
 *       - Salva os dados no banco de dados automaticamente
 *       
 *       **Filtro de prazo:**
 *       - `no_prazo`: Processos que estão dentro do prazo para manifestação
 *       - `sem_prazo`: Processos que não possuem prazo definido (padrão)
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
 *             $ref: '#/components/schemas/PendentesManifestacaoParams'
 *           example:
 *             advogado_id: 1
 *             trt_codigo: "TRT3"
 *             grau: "primeiro_grau"
 *             filtroPrazo: "sem_prazo"
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
 *                       description: Lista de processos pendentes de manifestação
 *                       items:
 *                         type: object
 *                     total:
 *                       type: integer
 *                       description: Total de processos capturados
 *                       example: 25
 *                     filtroPrazo:
 *                       type: string
 *                       enum: [no_prazo, sem_prazo]
 *                       description: Filtro de prazo utilizado na captura
 *                       example: "sem_prazo"
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
 *               error: "Credential not found or access denied"
 *       500:
 *         description: Erro interno do servidor ou erro de validação de quantidade
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               serverError:
 *                 value:
 *                   error: "Internal server error"
 *               validationError:
 *                 value:
 *                   error: "Quantidade de processos obtida (150) excede o totalizador (100). A raspagem pode estar incorreta."
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
    const { advogado_id, trt_codigo, grau, filtroPrazo } = body as PendentesManifestacaoParams;

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

    // Validar filtroPrazo se fornecido
    if (filtroPrazo && filtroPrazo !== 'no_prazo' && filtroPrazo !== 'sem_prazo') {
      return NextResponse.json(
        { error: 'filtroPrazo deve ser "no_prazo" ou "sem_prazo"' },
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
    const resultado = await pendentesManifestacaoCapture({
      credential,
      config: tribunalConfig,
      filtroPrazo: filtroPrazo || 'sem_prazo',
    });

    // 6. Retornar resultado (credenciais já foram limpas da memória)
    return NextResponse.json({
      success: true,
      data: resultado,
    });

  } catch (error) {
    console.error('Error in pendentes-manifestacao capture:', error);
    
    // Retornar erro específico se for erro de validação
    if (error instanceof Error && error.message.includes('Quantidade de processos')) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
