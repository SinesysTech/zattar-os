/**
 * API Route para captura de comunicações CNJ
 * POST: Executa captura e persistência de comunicações
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  executarCaptura,
  executarCapturaPorAdvogado,
} from '@/backend/comunica-cnj';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Schema de validação para body da requisição
 */
const capturaBodySchema = z.object({
  advogado_id: z.number().int().positive().optional(),
  numero_oab: z.string().optional(),
  uf_oab: z.string().length(2).optional(),
  sigla_tribunal: z.string().optional(),
  data_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (use yyyy-mm-dd)')
    .optional(),
  data_fim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (use yyyy-mm-dd)')
    .optional(),
});

/**
 * @swagger
 * /api/comunica-cnj/captura:
 *   post:
 *     summary: Executa captura de comunicações CNJ
 *     description: |
 *       Busca comunicações na API do CNJ e persiste no banco de dados.
 *       Para cada comunicação:
 *       1. Verifica se já existe (by hash) -> skip se duplicado
 *       2. Tenta encontrar expediente correspondente (match por número do processo, TRT, grau e data)
 *       3. Se não encontrar expediente, cria um novo com origem='comunica_cnj'
 *       4. Insere comunicação vinculada ao expediente
 *
 *       **Modos de captura:**
 *       - Por advogado_id: Busca OAB do advogado e captura suas comunicações
 *       - Por OAB: Informe numero_oab e uf_oab
 *       - Por tribunal: Informe sigla_tribunal
 *       - Por período: Informe data_inicio e data_fim
 *     tags:
 *       - Comunica CNJ
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
 *             properties:
 *               advogado_id:
 *                 type: integer
 *                 description: ID do advogado (busca OAB cadastrada)
 *               numero_oab:
 *                 type: string
 *                 description: Número da OAB
 *               uf_oab:
 *                 type: string
 *                 description: UF da OAB (2 letras)
 *               sigla_tribunal:
 *                 type: string
 *                 description: Sigla do tribunal
 *               data_inicio:
 *                 type: string
 *                 format: date
 *                 description: Data inicial (yyyy-mm-dd)
 *               data_fim:
 *                 type: string
 *                 format: date
 *                 description: Data final (yyyy-mm-dd)
 *           examples:
 *             porAdvogado:
 *               summary: Captura por advogado
 *               value:
 *                 advogado_id: 1
 *             porOab:
 *               summary: Captura por OAB
 *               value:
 *                 numero_oab: "123456"
 *                 uf_oab: "MG"
 *     responses:
 *       200:
 *         description: Captura executada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           description: Total de comunicações encontradas
 *                         novos:
 *                           type: integer
 *                           description: Comunicações novas inseridas
 *                         duplicados:
 *                           type: integer
 *                           description: Comunicações já existentes (ignoradas)
 *                         vinculados:
 *                           type: integer
 *                           description: Comunicações vinculadas a expedientes existentes
 *                         expedientesCriados:
 *                           type: integer
 *                           description: Expedientes criados automaticamente
 *                         erros:
 *                           type: integer
 *                           description: Erros durante processamento
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Lista de erros (se houver)
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validar body
    const body = await request.json();
    const validationResult = capturaBodySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Parâmetros inválidos',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const params = validationResult.data;

    // 3. Verificar se tem pelo menos um filtro
    if (
      !params.advogado_id &&
      !params.numero_oab &&
      !params.sigla_tribunal
    ) {
      return NextResponse.json(
        {
          error:
            'Informe pelo menos um filtro: advogado_id, numero_oab ou sigla_tribunal',
        },
        { status: 400 }
      );
    }

    // 4. Executar captura
    console.log('[POST /api/comunica-cnj/captura] Iniciando captura:', params);

    let result;

    if (params.advogado_id && !params.numero_oab) {
      // Captura por advogado (busca OAB do cadastro)
      result = await executarCapturaPorAdvogado(params.advogado_id);
    } else {
      // Captura por parâmetros
      result = await executarCaptura({
        advogado_id: params.advogado_id,
        numero_oab: params.numero_oab,
        uf_oab: params.uf_oab,
        sigla_tribunal: params.sigla_tribunal,
        data_inicio: params.data_inicio,
        data_fim: params.data_fim,
      });
    }

    console.log('[POST /api/comunica-cnj/captura] Captura finalizada:', result);

    // 5. Retornar resposta
    return NextResponse.json({
      success: result.success,
      data: {
        stats: result.stats,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error('[POST /api/comunica-cnj/captura] Error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Erro ao executar captura' },
      { status: 500 }
    );
  }
}
