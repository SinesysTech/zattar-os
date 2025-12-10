/**
 * API Route para captura de comunicações CNJ
 * POST: Executa captura e persistência de comunicações
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { sincronizarComunicacoes } from '@/core/comunica-cnj';
import { createDbClient } from '@/core/common/db';

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

    // 3. Se tem advogado_id mas não tem OAB, buscar OAB do cadastro
    let numeroOab = params.numero_oab;
    let ufOab = params.uf_oab;

    if (params.advogado_id && !numeroOab) {
      const db = createDbClient();
      const { data: advogado, error } = await db
        .from('advogados')
        .select('numero_oab, uf_oab')
        .eq('id', params.advogado_id)
        .single();

      if (error || !advogado) {
        return NextResponse.json(
          { error: 'Advogado não encontrado' },
          { status: 404 }
        );
      }

      if (!advogado.numero_oab || !advogado.uf_oab) {
        return NextResponse.json(
          { error: 'Advogado sem OAB cadastrada' },
          { status: 400 }
        );
      }

      numeroOab = advogado.numero_oab;
      ufOab = advogado.uf_oab;
    }

    // 4. Executar sincronização
    console.log('[POST /api/comunica-cnj/captura] Iniciando sincronização:', {
      ...params,
      numeroOab,
      ufOab,
    });

    const result = await sincronizarComunicacoes({
      advogadoId: params.advogado_id,
      numeroOab,
      ufOab,
      siglaTribunal: params.sigla_tribunal,
      dataInicio: params.data_inicio,
      dataFim: params.data_fim,
    });

    if (!result.success) {
      // Tratar erro
      if (result.error.code === 'VALIDATION_ERROR') {
        return NextResponse.json(
          {
            error: result.error.message,
            details: result.error.details,
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    console.log('[POST /api/comunica-cnj/captura] Sincronização finalizada:', result.data);

    // 5. Retornar resposta
    return NextResponse.json({
      success: result.data.success,
      data: {
        stats: result.data.stats,
        errors: result.data.errors,
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
