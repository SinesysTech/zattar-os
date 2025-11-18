// Rota de API para captura de audiências do TRT

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { getCredentialComplete } from '@/backend/captura/credentials/credential.service';
import { audienciasCapture } from '@/backend/captura/services/trt/audiencias.service';
import { getTribunalConfig } from '@/backend/captura/services/trt/config';
import { iniciarCapturaLog, finalizarCapturaLogSucesso, finalizarCapturaLogErro } from '@/backend/captura/services/captura-log.service';

interface AudienciasParams {
  advogado_id: number;
  credencial_ids: number[];
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
 *               dataInicio:
 *                 type: string
 *                 format: date
 *                 description: Data inicial do período de busca (YYYY-MM-DD). Se não fornecida, usa a data de hoje.
 *               dataFim:
 *                 type: string
 *                 format: date
 *                 description: Data final do período de busca (YYYY-MM-DD). Se não fornecida, usa hoje + 365 dias.
 *           example:
 *             advogado_id: 1
 *             credencial_ids: [1, 2, 3]
 *             dataInicio: "2024-01-01"
 *             dataFim: "2024-12-31"
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
 *                 capture_id:
 *                   type: integer
 *                   nullable: true
 *                   description: ID do registro de histórico da captura (para consulta posterior)
 *                   example: 123
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
 *                             description: Resultado da captura para esta credencial (inclui audiencias, total, persistencia)
 *                           erro:
 *                             type: string
 *                             description: Mensagem de erro se a captura falhou
 *       400:
 *         description: Parâmetros inválidos ou formato de data incorreto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingParams:
 *                 value:
 *                   error: "Missing required parameters: advogado_id, credencial_ids"
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
    const { advogado_id, credencial_ids, dataInicio, dataFim } = body as AudienciasParams;

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

    // 4. Criar registro de histórico de captura
    let logId: number | null = null;
    try {
      logId = await iniciarCapturaLog({
        tipo_captura: 'audiencias',
        advogado_id: advogado_id,
        credencial_ids: credencial_ids,
        status: 'in_progress',
      });
    } catch (error) {
      console.error('Erro ao criar registro de histórico:', error);
    }

    // 5. Processar cada credencial (assíncrono)
    Promise.all(
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
          const resultado = await audienciasCapture({
            credential: credCompleta.credenciais,
            config: tribunalConfig,
            dataInicio,
            dataFim,
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
    ).then(async (resultados) => {
      if (logId) {
        try {
          const resultadosFiltrados = resultados.filter((r): r is NonNullable<typeof r> => r !== null);
          const temErros = resultadosFiltrados.some((r) => 'erro' in r);
          if (temErros) {
            const erros = resultadosFiltrados
              .filter((r) => 'erro' in r)
              .map((r) => `Credencial ${r.credencial_id}: ${r.erro}`)
              .join('; ');
            await finalizarCapturaLogErro(logId, erros);
          } else {
            await finalizarCapturaLogSucesso(logId, {
              credenciais_processadas: resultadosFiltrados.length,
              resultados: resultadosFiltrados,
            });
          }
        } catch (error) {
          console.error('Erro ao atualizar histórico de captura:', error);
        }
      }
    }).catch((error) => {
      console.error('Erro ao processar capturas:', error);
      if (logId) {
        finalizarCapturaLogErro(logId, error instanceof Error ? error.message : 'Erro desconhecido').catch(
          (err) => console.error('Erro ao registrar erro no histórico:', err)
        );
      }
    });

    // 6. Retornar resultado imediato
    return NextResponse.json({
      success: true,
      message: 'Captura iniciada com sucesso',
      status: 'in_progress',
      capture_id: logId,
      data: {
        credenciais_processadas: credenciaisCompletas.length,
        message: 'A captura está sendo processada em background. Consulte o histórico para acompanhar o progresso.',
      },
    });

  } catch (error) {
    console.error('Error in audiencias capture:', error);

    // Retornar erro específico se for erro de validação
    if (error instanceof Error && (error.message.includes('Formato de data') || error.message.includes('não pode ser posterior'))) {
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
